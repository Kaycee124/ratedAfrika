import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator, SongCollaborator } from './entities/collaborator.entity';
import {
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
  CreateSongCollaboratorDto,
  UpdateSongCollaboratorDto,
} from './dto/collaborator.dto';

interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T | null;
}
import { CollaboratorRole } from './entities/collaborator.entity';
@Injectable()
export class CollaboratorService {
  private readonly logger = new Logger(CollaboratorService.name);

  constructor(
    @InjectRepository(Collaborator)
    private readonly collaboratorRepository: Repository<Collaborator>,
  ) {}

  async create(
    createCollaboratorDto: CreateCollaboratorDto,
  ): Promise<ApiResponse<Collaborator>> {
    try {
      const existingCollaborator = await this.collaboratorRepository.findOne({
        where: { email: createCollaboratorDto.email },
      });

      if (existingCollaborator) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Collaborator with this email already exists',
          data: existingCollaborator, // Return existing if found
        };
      }

      const collaborator = this.collaboratorRepository.create(
        createCollaboratorDto,
      );
      const savedCollaborator =
        await this.collaboratorRepository.save(collaborator);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Collaborator created successfully',
        data: savedCollaborator,
      };
    } catch (error) {
      this.logger.error(`Failed to create collaborator: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while creating the collaborator',
        data: null,
      };
    }
  }

  async findAll(): Promise<ApiResponse<Collaborator[]>> {
    try {
      const collaborators = await this.collaboratorRepository.find({
        order: { createdAt: 'DESC' },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborators retrieved successfully',
        data: collaborators,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch collaborators: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching collaborators',
        data: [],
      };
    }
  }

  async findOne(id: string): Promise<ApiResponse<Collaborator>> {
    try {
      const collaborator = await this.collaboratorRepository.findOne({
        where: { id },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Collaborator not found',
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborator retrieved successfully',
        data: collaborator,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch collaborator: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching the collaborator',
        data: null,
      };
    }
  }

  async findByEmail(email: string): Promise<ApiResponse<Collaborator>> {
    try {
      const collaborator = await this.collaboratorRepository.findOne({
        where: { email },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Collaborator not found',
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborator retrieved successfully',
        data: collaborator,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch collaborator by email: ${error.message}`,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching the collaborator',
        data: null,
      };
    }
  }

  async update(
    id: string,
    updateCollaboratorDto: UpdateCollaboratorDto,
  ): Promise<ApiResponse<Collaborator>> {
    try {
      const collaborator = await this.collaboratorRepository.findOne({
        where: { id },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Collaborator not found',
          data: null,
        };
      }

      if (
        updateCollaboratorDto.email &&
        updateCollaboratorDto.email !== collaborator.email
      ) {
        const existingCollaborator = await this.collaboratorRepository.findOne({
          where: { email: updateCollaboratorDto.email },
        });

        if (existingCollaborator) {
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'Email already in use',
            data: null,
          };
        }
      }

      Object.assign(collaborator, updateCollaboratorDto);
      const updatedCollaborator =
        await this.collaboratorRepository.save(collaborator);

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborator updated successfully',
        data: updatedCollaborator,
      };
    } catch (error) {
      this.logger.error(`Failed to update collaborator: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while updating the collaborator',
        data: null,
      };
    }
  }
}

@Injectable()
export class SongCollaboratorService {
  private readonly logger = new Logger(SongCollaboratorService.name);

  constructor(
    @InjectRepository(SongCollaborator)
    private readonly songCollaboratorRepository: Repository<SongCollaborator>,
    @InjectRepository(Collaborator)
    private readonly collaboratorRepository: Repository<Collaborator>,
  ) {}

  async createContribution(
    createDto: CreateSongCollaboratorDto,
  ): Promise<ApiResponse<SongCollaborator>> {
    try {
      // Verify collaborator exists
      const collaborator = await this.collaboratorRepository.findOne({
        where: { id: createDto.collaboratorId },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Collaborator not found',
          data: null,
        };
      }

      const contribution = this.songCollaboratorRepository.create(createDto);
      const savedContribution =
        await this.songCollaboratorRepository.save(contribution);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Contribution added successfully',
        data: savedContribution,
      };
    } catch (error) {
      this.logger.error(`Failed to create contribution: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while creating the contribution',
        data: null,
      };
    }
  }

  async findBySong(songId: string): Promise<ApiResponse<SongCollaborator[]>> {
    try {
      const contributions = await this.songCollaboratorRepository.find({
        where: { songId },
        relations: ['collaborator'],
        order: { createdAt: 'DESC' },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Contributions retrieved successfully',
        data: contributions,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch song contributions: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching contributions',
        data: [],
      };
    }
  }

  async updateContribution(
    id: string,
    updateDto: UpdateSongCollaboratorDto,
  ): Promise<ApiResponse<SongCollaborator>> {
    try {
      const contribution = await this.songCollaboratorRepository.findOne({
        where: { id },
        relations: ['collaborator'],
      });

      if (!contribution) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Contribution not found',
          data: null,
        };
      }

      Object.assign(contribution, updateDto);
      const updatedContribution =
        await this.songCollaboratorRepository.save(contribution);

      return {
        statusCode: HttpStatus.OK,
        message: 'Contribution updated successfully',
        data: updatedContribution,
      };
    } catch (error) {
      this.logger.error(`Failed to update contribution: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while updating the contribution',
        data: null,
      };
    }
  }

  async deleteContribution(id: string): Promise<ApiResponse> {
    try {
      const contribution = await this.songCollaboratorRepository.findOne({
        where: { id },
      });

      if (!contribution) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Contribution not found',
        };
      }

      await this.songCollaboratorRepository.softDelete(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Contribution deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete contribution: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while deleting the contribution',
      };
    }
  }

  async findByCollaborator(
    collaboratorId: string,
  ): Promise<ApiResponse<SongCollaborator[]>> {
    try {
      const contributions = await this.songCollaboratorRepository.find({
        where: { collaboratorId },
        relations: ['collaborator'],
        order: { createdAt: 'DESC' },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Contributions retrieved successfully',
        data: contributions,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch collaborator contributions: ${error.message}`,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching contributions',
        data: [],
      };
    }
  }

  async findBySongAndRole(
    songId: string,
    role: CollaboratorRole,
  ): Promise<ApiResponse<SongCollaborator[]>> {
    try {
      const contributions = await this.songCollaboratorRepository.find({
        where: { songId, role },
        relations: ['collaborator'],
        order: { createdAt: 'DESC' },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Contributions retrieved successfully',
        data: contributions,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch role-specific contributions: ${error.message}`,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching contributions',
        data: [],
      };
    }
  }
}
