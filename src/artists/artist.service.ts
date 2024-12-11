// src/artists/artists.service.ts
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';
import { CreateArtistDto } from './dtos/create-artist.dto';
import { UpdateArtistDto } from './dtos/update-artist.dto';
import { QueryArtistDto } from './dtos/query-artist.dto';
import { User } from '../users/user.entity';
// import { customLoggerClass } from 'src/logger/logger.service';

// Define consistent response interface
interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@Injectable()
export class ArtistsService {
  private readonly logger = new Logger(ArtistsService.name);

  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  async create(
    createArtistDto: CreateArtistDto,
    user: User,
  ): Promise<ApiResponse<Artist>> {
    try {
      // Check if artist with same stage name exists
      const existingArtist = await this.artistRepository.findOne({
        where: { stageName: createArtistDto.stageName },
      });

      if (existingArtist) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Stage name is already taken',
        };
      }

      // Create new artist
      const artist = this.artistRepository.create({
        ...createArtistDto,
        user,
      });

      const savedArtist = await this.artistRepository.save(artist);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Artist profile created successfully',
        data: savedArtist,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create artist: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while creating the artist profile',
      };
    }
  }

  // async findAll(queryDto: QueryArtistDto): Promise<
  //   ApiResponse<{
  //     artists: Artist[];
  //     meta: { total: number; page: number; limit: number; totalPages: number };
  //   }>
  // > {
  //   try {
  //     const { page, limit, genre, search } = queryDto;
  //     const skip = (page - 1) * limit;

  //     const queryBuilder = this.artistRepository
  //       .createQueryBuilder('artist')
  //       .leftJoinAndSelect('artist.user', 'user')
  //       .skip(skip)
  //       .take(limit);

  //     if (genre) {
  //       queryBuilder.andWhere('artist.genres @> ARRAY[:genre]', { genre });
  //     }

  //     if (search) {
  //       queryBuilder.andWhere(
  //         '(LOWER(artist.stageName) LIKE LOWER(:search) OR LOWER(artist.bio) LIKE LOWER(:search))',
  //         { search: `%${search}%` },
  //       );
  //     }

  //     const [artists, total] = await queryBuilder.getManyAndCount();

  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'Artists retrieved successfully',
  //       data: {
  //         artists,
  //         meta: {
  //           total,
  //           page,
  //           limit,
  //           totalPages: Math.ceil(total / limit),
  //         },
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to fetch artists: ${error.message}`,
  //       error.stack,
  //     );
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: 'An error occurred while fetching artists',
  //     };
  //   }
  // }
  // /////////////////////////////////demarcation
  // 333333333333333333333333333333333333333333
  async findAll(queryDto: QueryArtistDto): Promise<
    ApiResponse<{
      artists: Artist[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  > {
    try {
      // Parse query parameters with defaults
      const page = Number(queryDto.page) || 1;
      const limit = Number(queryDto.limit) || 10;
      const skip = (page - 1) * limit;

      // Validate pagination values
      if (isNaN(skip) || isNaN(limit)) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid pagination parameters',
        };
      }

      // Build query
      const queryBuilder = this.artistRepository
        .createQueryBuilder('artist')
        .leftJoinAndSelect('artist.user', 'user')
        .skip(skip)
        .take(limit);

      // Add genre filter if provided
      if (queryDto.genre) {
        queryBuilder.andWhere('artist.genres @> ARRAY[:genre]', {
          genre: queryDto.genre,
        });
      }

      // Add search filter if provided
      if (queryDto.search) {
        queryBuilder.andWhere(
          '(LOWER(artist.stageName) LIKE LOWER(:search) OR LOWER(artist.bio) LIKE LOWER(:search))',
          { search: `%${queryDto.search}%` },
        );
      }

      // Execute query
      const [artists, total] = await queryBuilder.getManyAndCount();

      return {
        statusCode: HttpStatus.OK,
        message: 'Artists retrieved successfully',
        data: {
          artists,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch artists: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching artists',
      };
    }
  }

  async findOne(id: string): Promise<ApiResponse<Artist>> {
    try {
      const artist = await this.artistRepository.findOne({
        where: { id },
        relations: ['user', 'songs'],
      });

      if (!artist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Artist with ID ${id} not found`,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Artist retrieved successfully',
        data: artist,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch artist: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching the artist',
      };
    }
  }

  async update(
    id: string,
    updateArtistDto: UpdateArtistDto,
    user: User,
  ): Promise<ApiResponse<Artist>> {
    try {
      const artist = await this.artistRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!artist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Artist with ID ${id} not found`,
        };
      }

      // Verify ownership
      if (artist.user.id !== user.id) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have permission to update this artist profile',
        };
      }

      // Check stage name uniqueness if it's being updated
      if (
        updateArtistDto.stageName &&
        updateArtistDto.stageName !== artist.stageName
      ) {
        const existingArtist = await this.artistRepository.findOne({
          where: { stageName: updateArtistDto.stageName },
        });

        if (existingArtist) {
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'Stage name is already taken',
          };
        }
      }

      // Update artist
      Object.assign(artist, updateArtistDto);
      const updatedArtist = await this.artistRepository.save(artist);

      return {
        statusCode: HttpStatus.OK,
        message: 'Artist profile updated successfully',
        data: updatedArtist,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update artist: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while updating the artist profile',
      };
    }
  }

  async remove(id: string, user: User): Promise<ApiResponse> {
    try {
      const artist = await this.artistRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!artist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Artist with ID ${id} not found`,
        };
      }

      // Verify ownership
      if (artist.user.id !== user.id) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have permission to delete this artist profile',
        };
      }

      await this.artistRepository.softDelete(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Artist profile deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete artist: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while deleting the artist profile',
      };
    }
  }

  async findByUser(userId: string): Promise<ApiResponse<Artist[]>> {
    try {
      const artists = await this.artistRepository.find({
        where: { user: { id: userId } },
        relations: ['songs'],
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'User artists retrieved successfully',
        data: artists,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch user's artists: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching user artists',
      };
    }
  }
}
