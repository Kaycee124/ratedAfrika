// // src/collaborators/services/collaborators.service.ts
// import { Injectable, Logger, HttpStatus } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Collaborator } from './entities/collaborator.entity';
// import { CollaboratorSplit } from './entities/collaborator-split.entity';

// import { CreateCollaboratorDto } from './dto/collaborator.dto';
// import { UpdateCollaboratorDto } from './dto/collaborator.dto';
// import { CreateSplitDto } from './dto/collaborator.dto';
// import { PaymentInfoDto } from './dto/paymentinfo.dto';

// // Define consistent response interface
// interface ApiResponse<T = any> {
//   statusCode: number;
//   message: string;
//   data?: T;
// }

// @Injectable()
// export class CollaboratorsService {
//   private readonly logger = new Logger(CollaboratorsService.name);

//   constructor(
//     @InjectRepository(Collaborator)
//     private readonly collaboratorsRepository: Repository<Collaborator>,
//     @InjectRepository(CollaboratorSplit)
//     private readonly splitsRepository: Repository<CollaboratorSplit>,
//     // @InjectRepository(Collaborator)
//     // private readonly collaboratorsRepository: Repository<Collaborator>,
//     // private readonly splitsRepository: CollaboratorSplitsRepository,
//   ) {}

//   private async validatePaymentInfo(
//     paymentInfo: PaymentInfoDto,
//   ): Promise<void> {
//     const { preferredMethod } = paymentInfo;

//     switch (preferredMethod) {
//       case 'bankAccount':
//         if (!paymentInfo.bankAccount) {
//           throw new Error('Bank account information is required');
//         }
//         break;
//       case 'paypal':
//         if (!paymentInfo.paypal) {
//           throw new Error('PayPal information is required');
//         }
//         break;
//       case 'crypto':
//         if (!paymentInfo.cryptoWallet) {
//           throw new Error('Crypto wallet information is required');
//         }
//         break;
//       default:
//         throw new Error('Invalid payment method');
//     }
//   }

//   async create(dto: CreateCollaboratorDto): Promise<ApiResponse<Collaborator>> {
//     try {
//       // Check for existing collaborator with same email
//       const existingCollaborator = await this.collaboratorsRepository.findOne({
//         where: { email: dto.email },
//       });

//       if (existingCollaborator) {
//         return {
//           statusCode: HttpStatus.CONFLICT,
//           message: 'Collaborator with this email already exists',
//         };
//       }

//       // Validate payment information
//       await this.validatePaymentInfo(dto.paymentInfo);

//       // Create new collaborator
//       const collaborator = new Collaborator();
//       Object.assign(collaborator, {
//         name: dto.name,
//         email: dto.email,
//         type: dto.type,
//         artistId: dto.artistId,
//         taxId: dto.taxId,
//         paymentInfo: dto.paymentInfo,
//         isVerified: false,
//       });

//       const savedCollaborator =
//         await this.collaboratorsRepository.save(collaborator);

//       return {
//         statusCode: HttpStatus.CREATED,
//         message: 'Collaborator created successfully',
//         data: savedCollaborator,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to create collaborator: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while creating the collaborator',
//       };
//     }
//   }

//   async findAll(): Promise<ApiResponse<Collaborator[]>> {
//     try {
//       const collaborators = await this.collaboratorsRepository.find({
//         relations: ['splits'],
//       });

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborators retrieved successfully',
//         data: collaborators,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to fetch collaborators: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching collaborators',
//       };
//     }
//   }

//   async findOne(id: string): Promise<ApiResponse<Collaborator>> {
//     try {
//       const collaborator = await this.collaboratorsRepository.findOne({
//         where: { id },
//         relations: ['splits'],
//       });

//       if (!collaborator) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: `Collaborator with ID ${id} not found`,
//         };
//       }

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborator retrieved successfully',
//         data: collaborator,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to fetch collaborator: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching the collaborator',
//       };
//     }
//   }

//   async update(
//     id: string,
//     dto: UpdateCollaboratorDto,
//   ): Promise<ApiResponse<Collaborator>> {
//     try {
//       const collaborator = await this.collaboratorsRepository.findOne({
//         where: { id },
//       });

//       if (!collaborator) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: `Collaborator with ID ${id} not found`,
//         };
//       }

//       if (dto.email && dto.email !== collaborator.email) {
//         const existingCollaborator = await this.collaboratorsRepository.findOne(
//           {
//             where: { email: dto.email },
//           },
//         );

//         if (existingCollaborator) {
//           return {
//             statusCode: HttpStatus.CONFLICT,
//             message: 'Email already in use',
//           };
//         }
//       }

//       if (dto.paymentInfo) {
//         await this.validatePaymentInfo(dto.paymentInfo);
//       }

//       Object.assign(collaborator, dto);
//       const updatedCollaborator =
//         await this.collaboratorsRepository.save(collaborator);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborator updated successfully',
//         data: updatedCollaborator,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to update collaborator: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while updating the collaborator',
//       };
//     }
//   }

//   async verifyCollaborator(id: string): Promise<ApiResponse<Collaborator>> {
//     try {
//       const collaborator = await this.collaboratorsRepository.findOne({
//         where: { id },
//       });

//       if (!collaborator) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: `Collaborator with ID ${id} not found`,
//         };
//       }

//       collaborator.isVerified = true;
//       const verifiedCollaborator =
//         await this.collaboratorsRepository.save(collaborator);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborator verified successfully',
//         data: verifiedCollaborator,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to verify collaborator: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while verifying the collaborator',
//       };
//     }
//   }

//   async createSplit(
//     createSplitDto: CreateSplitDto,
//   ): Promise<ApiResponse<CollaboratorSplit>> {
//     try {
//       // Check if collaborator exists
//       const collaborator = await this.collaboratorsRepository.findOne({
//         where: { id: createSplitDto.collaboratorId },
//       });

//       if (!collaborator) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Collaborator not found',
//         };
//       }

//       // Check total percentage using the custom repository method
//       const totalPercentage = await this.collaboratorSplitRepository.getTotalSplitPercentage(
//         createSplitDto.songId,
//         createSplitDto.splitType,
//       );

//       if (totalPercentage + createSplitDto.percentage > 100) {
//         return {
//           statusCode: HttpStatus.BAD_REQUEST,
//           message: 'Total split percentage cannot exceed 100%',
//         };
//       }

//       // Create and save split
//       const split = new CollaboratorSplit();
//       Object.assign(split, {
//         collaborator,
//         songId: createSplitDto.songId,
//         percentage: createSplitDto.percentage,
//         splitType: createSplitDto.splitType,
//       });

//       const savedSplit = await this.collaboratorSplitRepository.save(split);

//       return {
//         statusCode: HttpStatus.CREATED,
//         message: 'Split created successfully',
//         data: savedSplit,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to create split: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while creating the split',
//       };
//     }
//   }

//   async getSplits(songId: string): Promise<ApiResponse<CollaboratorSplit[]>> {
//     try {
//       const splits = await this.collaboratorSplitRepository.find({
//         where: { songId },
//         relations: ['collaborator'],
//       });

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Splits retrieved successfully',
//         data: splits,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to fetch splits: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching splits',
//       };
//     }
//   }

//   async removeSplit(id: string): Promise<ApiResponse> {
//     try {
//       const split = await this.collaboratorSplitRepository.findOne({
//         where: { id },
//       });

//       if (!split) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Split not found',
//         };
//       }

//       await this.collaboratorSplitRepository.remove(split);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Split deleted successfully',
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to delete split: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while deleting the split',
//       };
//     }
//   }
// }

import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator } from './entities/collaborator.entity';
import { CollaboratorSplit } from './entities/collaborator-split.entity';
import { CollaboratorSplitRepository } from './repositories/collaborator-splits.repository';
import { CreateCollaboratorDto } from './dto/collaborator.dto';
import { UpdateCollaboratorDto } from './dto/collaborator.dto';
import { CreateSplitDto } from './dto/collaborator.dto';
import { PaymentInfoDto } from './dto/paymentinfo.dto';
import { CollaboratorType, SplitType } from './types/collaborator-types';

interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T | null;
}

type CollaboratorResponse = ApiResponse<Collaborator>;
type CollaboratorsResponse = ApiResponse<Collaborator[]>;
type CollaboratorSplitResponse = ApiResponse<CollaboratorSplit>;
type CollaboratorSplitsResponse = ApiResponse<CollaboratorSplit[]>;

@Injectable()
export class CollaboratorsService {
  private readonly logger = new Logger(CollaboratorsService.name);

  constructor(
    @InjectRepository(Collaborator)
    private readonly collaboratorsRepository: Repository<Collaborator>,
    private readonly collaboratorSplitRepository: CollaboratorSplitRepository,
  ) {}

  private async validatePaymentInfo(
    paymentInfo: PaymentInfoDto,
  ): Promise<void> {
    this.logger.debug('Validating payment information');
    const { preferredMethod } = paymentInfo;

    switch (preferredMethod) {
      case 'bankAccount':
        if (!paymentInfo.bankAccount) {
          throw new Error('Bank account information is required');
        }
        if (
          !paymentInfo.bankAccount.accountNumber ||
          !paymentInfo.bankAccount.bankName
        ) {
          throw new Error('Bank account details are incomplete');
        }
        if (!paymentInfo.bankAccount.swiftCode) {
          throw new Error('SWIFT code is required for bank accounts');
        }
        break;

      case 'paypal':
        if (!paymentInfo.paypal?.email) {
          throw new Error('PayPal email is required');
        }
        if (!this.isValidEmail(paymentInfo.paypal.email)) {
          throw new Error('Invalid PayPal email format');
        }
        break;

      case 'crypto':
        if (!paymentInfo.cryptoWallet) {
          throw new Error('Crypto wallet information is required');
        }
        if (
          !this.isValidWalletAddress(paymentInfo.cryptoWallet.walletAddress)
        ) {
          throw new Error('Invalid crypto wallet address');
        }
        break;

      default:
        throw new Error('Invalid payment method');
    }

    if (!paymentInfo.currency) {
      throw new Error('Currency must be specified');
    }

    if (!paymentInfo.taxResidenceCountry) {
      throw new Error('Tax residence country must be specified');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidWalletAddress(address: string): boolean {
    return /^[A-Za-z0-9]{26,35}$/.test(address);
  }

  async create(dto: CreateCollaboratorDto): Promise<CollaboratorResponse> {
    this.logger.log(`Creating new collaborator with email: ${dto.email}`);
    try {
      const existingCollaborator = await this.collaboratorsRepository.findOne({
        where: { email: dto.email },
      });

      if (existingCollaborator) {
        this.logger.warn(
          `Attempted to create duplicate collaborator: ${dto.email}`,
        );
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Collaborator with this email already exists',
          data: null,
        };
      }

      await this.validatePaymentInfo(dto.paymentInfo);

      const collaborator = this.collaboratorsRepository.create({
        name: dto.name,
        email: dto.email,
        type: dto.type as unknown as CollaboratorType,
        artistId: dto.artistId,
        taxId: dto.taxId,
        paymentInfo: {
          preferredMethod: dto.paymentInfo.preferredMethod,
          bankAccount: dto.paymentInfo.bankAccount,
          paypal: dto.paymentInfo.paypal,
          cryptoWallet: dto.paymentInfo.cryptoWallet,
          currency: dto.paymentInfo.currency,
          taxResidenceCountry: dto.paymentInfo.taxResidenceCountry,
        },
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
        data: null,
      };
    }
  }

  async findAll(): Promise<CollaboratorsResponse> {
    try {
      const collaborators = await this.collaboratorsRepository.find({
        relations: ['splits'],
        order: {
          createdAt: 'DESC',
          name: 'ASC',
        },
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
        data: [],
      };
    }
  }

  async findOne(id: string): Promise<CollaboratorResponse> {
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id },
        relations: ['splits'],
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Collaborator with ID ${id} not found`,
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
        `Failed to fetch collaborator: ${error.message}`,
        error.stack,
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
    dto: UpdateCollaboratorDto,
  ): Promise<CollaboratorResponse> {
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id },
        relations: ['splits'],
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Collaborator with ID ${id} not found`,
          data: null,
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
            data: null,
          };
        }
      }

      if (dto.paymentInfo) {
        await this.validatePaymentInfo(dto.paymentInfo);
      }

      if (collaborator.splits?.length > 0) {
        const protectedFields = ['taxId', 'type'];
        for (const field of protectedFields) {
          if (dto[field] !== undefined && dto[field] !== collaborator[field]) {
            return {
              statusCode: HttpStatus.FORBIDDEN,
              message: `Cannot update ${field} when collaborator has existing splits`,
              data: null,
            };
          }
        }
      }

      Object.assign(collaborator, {
        ...dto,
        paymentInfo: dto.paymentInfo
          ? {
              ...collaborator.paymentInfo,
              ...dto.paymentInfo,
            }
          : collaborator.paymentInfo,
      });

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
        data: null,
      };
    }
  }

  async createSplit(
    createSplitDto: CreateSplitDto,
  ): Promise<CollaboratorSplitResponse> {
    this.logger.log(`Creating split for song ID: ${createSplitDto.songId}`);
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id: createSplitDto.collaboratorId },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Collaborator not found',
          data: null,
        };
      }

      if (!collaborator.isVerified) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Cannot create splits for unverified collaborators',
          data: null,
        };
      }

      const isValidAllocation =
        await this.collaboratorSplitRepository.validateSplitAllocation(
          createSplitDto.songId,
          createSplitDto.splitType,
          createSplitDto.percentage,
        );

      if (!isValidAllocation) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Total split percentage cannot exceed 100%',
          data: null,
        };
      }

      const split = await this.collaboratorSplitRepository.createSplit({
        collaborator,
        songId: createSplitDto.songId,
        percentage: createSplitDto.percentage,
        splitType: createSplitDto.splitType,
        isVerified: false,
        isLocked: false,
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Split created successfully',
        data: split,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create split: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while creating the split',
        data: null,
      };
    }
  }

  async getSplits(
    songId: string,
    splitType?: SplitType,
  ): Promise<CollaboratorSplitsResponse> {
    try {
      const splits = splitType
        ? await this.collaboratorSplitRepository.findBySongAndType(
            songId,
            splitType,
          )
        : await this.collaboratorSplitRepository.findBySongId(songId);

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
        data: [],
      };
    }
  }

  async updateSplit(
    id: string,
    updateData: Partial<CollaboratorSplit>,
  ): Promise<CollaboratorSplitResponse> {
    try {
      const split = await this.collaboratorSplitRepository.findOne({
        where: { id },
      });

      if (!split) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Split not found',
          data: null,
        };
      }

      if (split.isLocked) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Cannot modify a locked split',
          data: null,
        };
      }

      if (updateData.percentage && updateData.percentage !== split.percentage) {
        const isValidAllocation =
          await this.collaboratorSplitRepository.validateSplitAllocation(
            split.songId,
            split.splitType,
            updateData.percentage,
            split.id,
          );

        if (!isValidAllocation) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Total split percentage cannot exceed 100%',
            data: null,
          };
        }
      }

      const updatedSplit = await this.collaboratorSplitRepository.updateSplit(
        id,
        updateData,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Split updated successfully',
        data: updatedSplit,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update split: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while updating the split',
        data: null,
      };
    }
  }

  async lockSplit(id: string): Promise<CollaboratorSplitResponse> {
    try {
      const split = await this.collaboratorSplitRepository.findOne({
        where: { id },
      });

      if (!split) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Split not found',
          data: null,
        };
      }

      if (split.isLocked) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Split is already locked',
          data: null,
        };
      }

      if (!split.isVerified) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Cannot lock unverified splits',
          data: null,
        };
      }

      const lockedSplit = await this.collaboratorSplitRepository.lockSplit(id);

      return {
        statusCode: HttpStatus.OK,
        message: 'Split locked successfully',
        data: lockedSplit,
      };
    } catch (error) {
      this.logger.error(`Failed to lock split: ${error.message}`, error.stack);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while locking the split',
        data: null,
      };
    }
  }

  // watch code

  async verifyMultipleSplits(
    ids: string[],
    verifiedBy: string,
  ): Promise<CollaboratorSplitsResponse> {
    try {
      const verifiedSplits = await Promise.all(
        ids.map((id) =>
          this.collaboratorSplitRepository.verifySplit(id, verifiedBy),
        ),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Splits verified successfully',
        data: verifiedSplits.filter(Boolean),
      };
    } catch (error) {
      this.logger.error(
        `Failed to verify splits: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while verifying splits',
        data: [],
      };
    }
  }

  async removeSplit(id: string): Promise<ApiResponse> {
    try {
      const split = await this.collaboratorSplitRepository.findOne({
        where: { id },
      });

      if (!split) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Split not found',
          data: null,
        };
      }

      if (split.isLocked) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Cannot remove a locked split',
          data: null,
        };
      }

      await this.collaboratorSplitRepository.deleteSplit(id);

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
        data: null,
      };
    }
  }

  async verifyCollaborator(id: string): Promise<CollaboratorResponse> {
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id },
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Collaborator with ID ${id} not found`,
          data: null,
        };
      }

      if (collaborator.isVerified) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Collaborator is already verified',
          data: collaborator,
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
        data: null,
      };
    }
  }

  async findByEmail(email: string): Promise<CollaboratorResponse> {
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { email },
        relations: ['splits'],
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `Collaborator with email ${email} not found`,
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
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching the collaborator',
        data: null,
      };
    }
  }

  async getSplitTotals(
    songId: string,
  ): Promise<ApiResponse<Record<SplitType, number>>> {
    try {
      const totals: Record<SplitType, number> = {} as Record<SplitType, number>;
      const splitTypes = Object.values(SplitType) as SplitType[];

      for (const splitType of splitTypes) {
        const total =
          await this.collaboratorSplitRepository.getTotalSplitPercentage(
            songId,
            splitType,
          );
        totals[splitType] = total;
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Split totals retrieved successfully',
        data: totals,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch split totals: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching split totals',
        data: null,
      };
    }
  }

  async findByType(type: CollaboratorType): Promise<CollaboratorsResponse> {
    try {
      const collaborators = await this.collaboratorsRepository.find({
        where: { type },
        relations: ['splits'],
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborators retrieved successfully',
        data: collaborators,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch collaborators by type: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching collaborators',
        data: [],
      };
    }
  }

  async getCollaboratorStats(id: string): Promise<ApiResponse<any>> {
    try {
      const collaborator = await this.collaboratorsRepository.findOne({
        where: { id },
        relations: ['splits'],
      });

      if (!collaborator) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Collaborator not found',
          data: null,
        };
      }

      const stats = {
        totalSplits: collaborator.splits.length,
        totalSongs: new Set(collaborator.splits.map((split) => split.songId))
          .size,
        splitsByType: collaborator.splits.reduce(
          (acc, split) => {
            acc[split.splitType] = (acc[split.splitType] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        averagePercentage:
          collaborator.splits.reduce(
            (sum, split) => sum + split.percentage,
            0,
          ) / collaborator.splits.length || 0,
      };

      return {
        statusCode: HttpStatus.OK,
        message: 'Collaborator stats retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch collaborator stats: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching collaborator stats',
        data: null,
      };
    }
  }
}
