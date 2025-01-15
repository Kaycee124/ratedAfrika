// src/labels/labels.service.ts
import {
  Injectable,
  Logger,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Label } from './label.entity';
import { CreateLabelDto } from './dto/label.dto';
import { UpdateLabelDto } from './dto/label.dto';
import { QueryLabelDto } from './dto/label.dto';
import { User } from '../users/user.entity';
import { Artist } from 'src/artists/entities/artist.entity';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@Injectable()
export class LabelsService {
  private readonly logger = new Logger(LabelsService.name);

  constructor(
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
  ) {}

  async create(
    createLabelDto: CreateLabelDto,
    user: User,
  ): Promise<ApiResponse<Label>> {
    try {
      // Check if label with same name exists
      const existingLabel = await this.labelRepository.findOne({
        where: { labelName: createLabelDto.labelName },
      });

      if (existingLabel) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Label name is already taken',
        };
      }

      // Create new label
      const label = this.labelRepository.create({
        ...createLabelDto,
        user,
      });

      const savedLabel = await this.labelRepository.save(label);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Label created successfully',
        data: savedLabel,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create label: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while creating the label',
      };
    }
  }

  async findAll(queryDto: QueryLabelDto): Promise<
    ApiResponse<{
      labels: Label[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  > {
    try {
      // Parse and validate queryDto using class-transformer and class-validator
      const validatedDto = plainToClass(QueryLabelDto, queryDto);
      const errors = await validate(validatedDto);
      if (errors.length > 0) {
        throw new BadRequestException('Invalid query parameters');
      }

      const { page = 1, limit = 10, genre, search } = validatedDto;

      const skip = (page - 1) * limit;

      // Ensure skip and limit are numbers
      if (isNaN(skip) || isNaN(limit)) {
        throw new BadRequestException('"skip" and "limit" must be numbers');
      }

      const queryBuilder = this.labelRepository
        .createQueryBuilder('label')
        .leftJoinAndSelect('label.user', 'user')
        .leftJoinAndSelect('label.artistRoster', 'artists')
        .skip(skip)
        .take(limit);

      if (genre) {
        queryBuilder.andWhere('label.genres @> ARRAY[:genre]', { genre });
      }

      if (search) {
        queryBuilder.andWhere(
          '(LOWER(label.labelName) LIKE LOWER(:search) OR LOWER(label.bio) LIKE LOWER(:search))',
          { search: `%${search}%` },
        );
      }

      const [labels, total] = await queryBuilder.getManyAndCount();

      return {
        statusCode: HttpStatus.OK,
        message: 'Labels retrieved successfully',
        data: {
          labels,
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
        `Failed to fetch labels: ${error.message}`,
        error.stack,
      );
      // Differentiate between known exceptions and internal errors
      if (error instanceof BadRequestException) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
        };
      }
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching labels',
      };
    }
  }

  // src/labels/labels.service.ts (continued)

  async findOne(id: string): Promise<ApiResponse<Label>> {
    try {
      const label = await this.labelRepository.findOne({
        where: { id },
        relations: ['user', 'artistRoster'],
      });

      if (!label) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Label with ID ${id} not found`,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Label retrieved successfully',
        data: label,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch label: ${error.message}`, error.stack);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching the label',
      };
    }
  }

  async update(
    id: string,
    updateLabelDto: UpdateLabelDto,
    user: User,
  ): Promise<ApiResponse<Label>> {
    try {
      const label = await this.labelRepository.findOne({
        where: { id },
        relations: ['user'],
      });

      if (!label) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Label with ID ${id} not found`,
        };
      }

      // Verify ownership
      if (label.user.id !== user.id) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have permission to update this label',
        };
      }

      // Check label name uniqueness if it's being updated
      if (
        updateLabelDto.labelName &&
        updateLabelDto.labelName !== label.labelName
      ) {
        const existingLabel = await this.labelRepository.findOne({
          where: { labelName: updateLabelDto.labelName },
        });

        if (existingLabel) {
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'Label name is already taken',
          };
        }
      }

      // Update label
      Object.assign(label, updateLabelDto);
      const updatedLabel = await this.labelRepository.save(label);

      return {
        statusCode: HttpStatus.OK,
        message: 'Label updated successfully',
        data: updatedLabel,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update label: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while updating the label',
      };
    }
  }

  async remove(id: string, user: User): Promise<ApiResponse> {
    try {
      const label = await this.labelRepository.findOne({
        where: { id },
        relations: ['user', 'artistRoster'],
      });

      if (!label) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Label with ID ${id} not found`,
        };
      }

      // Verify ownership
      if (label.user.id !== user.id) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have permission to delete this label',
        };
      }

      // Check if label has artists in roster
      if (label.artistRoster && label.artistRoster.length > 0) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Cannot delete label with active artists in roster',
          data: {
            artistCount: label.artistRoster.length,
          },
        };
      }

      await this.labelRepository.softDelete(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Label deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete label: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while deleting the label',
      };
    }
  }

  async findByUser(userId: string): Promise<ApiResponse<Label[]>> {
    try {
      const labels = await this.labelRepository.find({
        where: { user: { id: userId } },
        relations: ['artistRoster'],
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'User labels retrieved successfully',
        data: labels,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch user's labels: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching user labels',
      };
    }
  }

  async addArtistToRoster(
    labelId: string,
    artistId: string,
    user: User,
  ): Promise<ApiResponse> {
    try {
      // Get label with its current roster
      const label = await this.labelRepository.findOne({
        where: { id: labelId },
        relations: ['user', 'artistRoster'],
      });

      if (!label) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Label not found',
        };
      }

      // Verify ownership
      if (label.user.id !== user.id) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: "You do not have permission to manage this label's roster",
        };
      }

      // Find the artist
      const artist = await this.artistRepository.findOne({
        where: { id: artistId },
        relations: ['label'], // Include label relation to check current label
      });

      if (!artist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Artist not found',
        };
      }

      // Check if artist already has a label
      if (artist.label) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Artist is already signed to a different label',
          data: {
            currentLabel: {
              id: artist.label.id,
              name: artist.label.labelName,
            },
          },
        };
      }

      // Check if artist already in this label's roster
      const isArtistInRoster = label.artistRoster.some(
        (rosterArtist) => rosterArtist.id === artistId,
      );

      if (isArtistInRoster) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: "Artist is already in this label's roster",
        };
      }

      // Update the artist's label reference
      artist.label = label;
      await this.artistRepository.save(artist);

      // Update label's roster (Optional: TypeORM will handle this automatically through cascade)
      label.artistRoster.push(artist);
      await this.labelRepository.save(label);

      return {
        statusCode: HttpStatus.OK,
        message: 'Artist added to roster successfully',
        data: {
          label: {
            id: label.id,
            labelName: label.labelName,
          },
          artist: {
            id: artist.id,
            stageName: artist.name,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to add artist to roster: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while adding artist to roster',
      };
    }
  }

  async removeArtistFromRoster(
    labelId: string,
    artistId: string,
    user: User,
  ): Promise<ApiResponse> {
    try {
      const label = await this.labelRepository.findOne({
        where: { id: labelId },
        relations: ['user', 'artistRoster'],
      });

      if (!label) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Label not found',
        };
      }

      // Verify ownership
      if (label.user.id !== user.id) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: "You do not have permission to manage this label's roster",
        };
      }

      // Find the artist
      const artist = await this.artistRepository.findOne({
        where: { id: artistId },
        relations: ['label'],
      });

      if (!artist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Artist not found',
        };
      }

      // Verify artist is actually in this label's roster
      if (artist.label?.id !== label.id) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: "Artist is not in this label's roster",
        };
      }

      // Remove label reference from artist
      artist.label = null;
      await this.artistRepository.save(artist);

      // Update label's roster (Optional: TypeORM will handle this automatically)
      label.artistRoster = label.artistRoster.filter(
        (rosterArtist) => rosterArtist.id !== artistId,
      );
      await this.labelRepository.save(label);

      return {
        statusCode: HttpStatus.OK,
        message: 'Artist removed from roster successfully',
        data: {
          label: {
            id: label.id,
            labelName: label.labelName,
          },
          artist: {
            id: artist.id,
            stageName: artist.name,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to remove artist from roster: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while removing artist from roster',
      };
    }
  }
}
