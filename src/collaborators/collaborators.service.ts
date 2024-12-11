// src/collaborators/services/collaborators.service.ts
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator } from './entities/collaborator.entity';
import { CollaboratorSplit } from './entities/collaborator-split.entity';
import { CollaboratorSplitsRepository } from './repositories/collaborator-splits.repository';
import { CreateCollaboratorDto } from './dto/collaborator.dto';
import { UpdateCollaboratorDto } from './dto/collaborator.dto';
import { CreateSplitDto } from './dto/collaborator.dto';
import { PaymentInfoDto } from './dto/paymentinfo.dto';

// Define consistent response interface
interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@Injectable()
export class CollaboratorsService {
  private readonly logger = new Logger(CollaboratorsService.name);

  constructor(
    @InjectRepository(Collaborator)
    private readonly collaboratorsRepository: Repository<Collaborator>,
    private readonly splitsRepository: CollaboratorSplitsRepository,
  ) {}

  private async validatePaymentInfo(
    paymentInfo: PaymentInfoDto,
  ): Promise<void> {
    const { preferredMethod } = paymentInfo;

    switch (preferredMethod) {
      case 'bankAccount':
        if (!paymentInfo.bankAccount) {
          throw new Error('Bank account information is required');
        }
        break;
      case 'paypal':
        if (!paymentInfo.paypal) {
          throw new Error('PayPal information is required');
        }
        break;
      case 'crypto':
        if (!paymentInfo.cryptoWallet) {
          throw new Error('Crypto wallet information is required');
        }
        break;
      default:
        throw new Error('Invalid payment method');
    }
  }

  async create(dto: CreateCollaboratorDto): Promise<ApiResponse<Collaborator>> {
    try {
      // Check for existing collaborator with same email
      const existingCollaborator = await this.collaboratorsRepository.findOne({
        where: { email: dto.email },
      });

      if (existingCollaborator) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Collaborator with this email already exists',
        };
      }

      // Validate payment information
      await this.validatePaymentInfo(dto.paymentInfo);

      // Create new collaborator
      const collaborator = new Collaborator();
      Object.assign(collaborator, {
        name: dto.name,
        email: dto.email,
        type: dto.type,
        artistId: dto.artistId,
        taxId: dto.taxId,
        paymentInfo: dto.paymentInfo,
        isVerified: false,
      });

      const savedCollaborator =
        await this.collaboratorsRepository.save(collaborator);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Collaborator created successfully',
        data: savedCollaborator,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create collaborator: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while creating the collaborator',
      };
    }
  }

  async findAll(): Promise<ApiResponse<Collaborator[]>> {
    try {
      const collaborators = await this.collaboratorsRepository.find({
        relations: ['splits'],
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborators retrieved successfully',
        data: collaborators,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch collaborators: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching collaborators',
      };
    }
  }

  async findOne(id: string): Promise<ApiResponse<Collaborator>> {
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id },
        relations: ['splits'],
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Collaborator with ID ${id} not found`,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborator retrieved successfully',
        data: collaborator,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch collaborator: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching the collaborator',
      };
    }
  }

  async update(
    id: string,
    dto: UpdateCollaboratorDto,
  ): Promise<ApiResponse<Collaborator>> {
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Collaborator with ID ${id} not found`,
        };
      }

      if (dto.email && dto.email !== collaborator.email) {
        const existingCollaborator = await this.collaboratorsRepository.findOne(
          {
            where: { email: dto.email },
          },
        );

        if (existingCollaborator) {
          return {
            statusCode: HttpStatus.CONFLICT,
            message: 'Email already in use',
          };
        }
      }

      if (dto.paymentInfo) {
        await this.validatePaymentInfo(dto.paymentInfo);
      }

      Object.assign(collaborator, dto);
      const updatedCollaborator =
        await this.collaboratorsRepository.save(collaborator);

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborator updated successfully',
        data: updatedCollaborator,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update collaborator: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while updating the collaborator',
      };
    }
  }

  async verifyCollaborator(id: string): Promise<ApiResponse<Collaborator>> {
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Collaborator with ID ${id} not found`,
        };
      }

      collaborator.isVerified = true;
      const verifiedCollaborator =
        await this.collaboratorsRepository.save(collaborator);

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborator verified successfully',
        data: verifiedCollaborator,
      };
    } catch (error) {
      this.logger.error(
        `Failed to verify collaborator: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while verifying the collaborator',
      };
    }
  }

  async createSplit(
    createSplitDto: CreateSplitDto,
  ): Promise<ApiResponse<CollaboratorSplit>> {
    try {
      // Check if collaborator exists
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id: createSplitDto.collaboratorId },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Collaborator not found',
        };
      }

      // Check total percentage
      const totalPercentage =
        await this.splitsRepository.getTotalSplitPercentage(
          createSplitDto.songId,
          createSplitDto.splitType,
        );

      if (totalPercentage + createSplitDto.percentage > 100) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Total split percentage cannot exceed 100%',
        };
      }

      // Create and save split
      const split = new CollaboratorSplit();
      Object.assign(split, {
        collaborator,
        songId: createSplitDto.songId,
        percentage: createSplitDto.percentage,
        splitType: createSplitDto.splitType,
      });

      const savedSplit = await this.splitsRepository.save(split);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Split created successfully',
        data: savedSplit,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create split: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while creating the split',
      };
    }
  }

  async getSplits(songId: string): Promise<ApiResponse<CollaboratorSplit[]>> {
    try {
      const splits = await this.splitsRepository.find({
        where: { songId },
        relations: ['collaborator'],
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Splits retrieved successfully',
        data: splits,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch splits: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching splits',
      };
    }
  }

  async removeSplit(id: string): Promise<ApiResponse> {
    try {
      const split = await this.splitsRepository.findOne({
        where: { id },
      });

      if (!split) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Split not found',
        };
      }

      await this.splitsRepository.remove(split);

      return {
        statusCode: HttpStatus.OK,
        message: 'Split deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete split: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while deleting the split',
      };
    }
  }
}
