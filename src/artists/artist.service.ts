import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artist } from './entities/artist.entity';
import { CreateArtistDto } from './dtos/create-artist.dto';
import { UpdateArtistDto } from './dtos/update-artist.dto';
import { QueryArtistDto } from './dtos/query-artist.dto';
import { User } from '../users/user.entity';
import { Label } from '../label/label.entity';
import {
  SimplifiedCreateArtistDto,
  SimplifiedCreateTempArtistDto,
} from './dtos/create-artist.dto';
import { TempArtist } from './entities/temp-artist.entity';
import { TokenService } from '../auth/services/token.service';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(TempArtist)
    private readonly tempArtistRepository: Repository<TempArtist>,
    private readonly tokenService: TokenService,
  ) {}

  async create(
    createArtistDto: CreateArtistDto,
    user: User,
  ): Promise<ApiResponse<Artist & { newAccessToken?: string }>> {
    // Check if artist with same name exists
    const existingArtist = await this.artistRepository.findOne({
      where: { name: createArtistDto.name },
    });

    if (existingArtist) {
      throw new HttpException(
        'Artist name is already taken',
        HttpStatus.CONFLICT,
      );
    }

    // Create new artist
    const artist = this.artistRepository.create({
      ...createArtistDto,
      user,
    });

    const savedArtist = await this.artistRepository.save(artist);

    // Generate new access token with updated artist profiles
    const userWithArtists = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['artistProfiles'],
    });

    const newAccessToken =
      await this.tokenService.generateAccessToken(userWithArtists);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Artist profile created successfully',
      data: {
        ...savedArtist,
        newAccessToken,
      },
    };
  }

  async findAll(queryDto: QueryArtistDto): Promise<
    ApiResponse<{
      artists: Artist[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  > {
    // Parse query parameters with defaults
    const page = Number(queryDto.page) || 1;
    const limit = Number(queryDto.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate pagination values
    if (isNaN(skip) || isNaN(limit)) {
      throw new HttpException(
        'Invalid pagination parameters',
        HttpStatus.BAD_REQUEST,
      );
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

    // Add country filter if provided
    if (queryDto.country) {
      queryBuilder.andWhere('LOWER(artist.country) = LOWER(:country)', {
        country: queryDto.country,
      });
    }

    // Add search filter if provided
    if (queryDto.search) {
      queryBuilder.andWhere(
        '(LOWER(artist.name) LIKE LOWER(:search) OR LOWER(artist.bio) LIKE LOWER(:search))',
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
  }

  async findOne(id: string): Promise<ApiResponse<Artist>> {
    const artist = await this.artistRepository.findOne({
      where: { id },
      relations: ['user', 'songs'],
    });

    if (!artist) {
      throw new HttpException(
        `Artist with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Artist retrieved successfully',
      data: artist,
    };
  }

  async update(
    id: string,
    updateArtistDto: UpdateArtistDto,
    user: User,
  ): Promise<ApiResponse<Artist>> {
    const artist = await this.artistRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!artist) {
      throw new HttpException(
        `Artist with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify ownership
    if (artist.user.id !== user.id) {
      throw new HttpException(
        'You do not have permission to update this artist profile',
        HttpStatus.FORBIDDEN,
      );
    }

    // Check name uniqueness if it's being updated
    if (updateArtistDto.name && updateArtistDto.name !== artist.name) {
      const existingArtist = await this.artistRepository.findOne({
        where: { name: updateArtistDto.name },
      });

      if (existingArtist) {
        throw new HttpException(
          'Artist name is already taken',
          HttpStatus.CONFLICT,
        );
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
  }

  async remove(id: string, user: User): Promise<ApiResponse> {
    const artist = await this.artistRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!artist) {
      throw new HttpException(
        `Artist with ID ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Verify ownership
    if (artist.user.id !== user.id) {
      throw new HttpException(
        'You do not have permission to delete this artist profile',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.artistRepository.softDelete(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Artist profile deleted successfully',
    };
  }

  async findByUser(userId: string): Promise<ApiResponse<Artist[]>> {
    const artists = await this.artistRepository.find({
      where: { user: { id: userId } },
      relations: ['songs'],
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'User artists retrieved successfully',
      data: artists,
    };
  }

  // Add these methods to artist.service.ts

  async createSimplifiedArtist(
    createDto: SimplifiedCreateArtistDto,
    user: User,
  ): Promise<ApiResponse<Artist & { newAccessToken?: string }>> {
    // Check if an artist with this name already exists
    const existingArtistByName = await this.artistRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingArtistByName) {
      throw new HttpException(
        'Artist name is already taken',
        HttpStatus.CONFLICT,
      );
    }

    // Check if an artist with this email already exists
    const existingArtistByEmail = await this.artistRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingArtistByEmail) {
      throw new HttpException(
        'Artist email is already registered',
        HttpStatus.CONFLICT,
      );
    }

    // Create new artist with name and email
    // Initialize other required fields with empty values
    const artist = this.artistRepository.create({
      name: createDto.name,
      email: createDto.email,
      user,
      // Initialize required fields with default values
      country: '', // Can be updated later
      phoneNumber: '', // Can be updated later
      genres: [], // Initialize as empty array
      musicPlatforms: {}, // Initialize as empty object
      socialMediaLinks: {}, // Initialize as empty object
    });

    const savedArtist = await this.artistRepository.save(artist);

    // Generate new access token with updated artist profiles
    const userWithArtists = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['artistProfiles'],
    });

    const newAccessToken =
      await this.tokenService.generateAccessToken(userWithArtists);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Artist profile created successfully',
      data: {
        ...savedArtist,
        newAccessToken,
      },
    };
  }

  async createSimplifiedTempArtist(
    createDto: SimplifiedCreateTempArtistDto,
  ): Promise<ApiResponse<TempArtist>> {
    // Check if temp artist with same name exists
    const existingTempArtist = await this.tempArtistRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingTempArtist) {
      throw new HttpException(
        'artist name is already taken',
        HttpStatus.CONFLICT,
      );
    }

    // Create new temp artist with just the name
    const tempArtist = this.tempArtistRepository.create({
      name: createDto.name,
      // Other fields will use their default values from the entity
    });

    const savedTempArtist = await this.tempArtistRepository.save(tempArtist);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Temporary artist profile created successfully',
      data: savedTempArtist,
    };
  }
}
