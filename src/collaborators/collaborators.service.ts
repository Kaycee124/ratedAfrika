import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator } from './entities/collaborator.entity';
import {
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
  // CreateSongCollaboratorDto,
  // UpdateSongCollaboratorDto,
} from './dto/collaborator.dto';

interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T | null;
}
// import { CollaboratorRole } from './entities/collaborator.entity';
@Injectable()
export class CollaboratorService {
  private readonly logger = new Logger(CollaboratorService.name);

  constructor(
    @InjectRepository(Collaborator)
    private readonly collaboratorRepository: Repository<Collaborator>,
  ) {}

  async create(
    createCollaboratorDto: CreateCollaboratorDto,
    user: any, // Accept the user object
  ): Promise<ApiResponse<Collaborator>> {
    const existingCollaborator = await this.collaboratorRepository.findOne({
      where: { email: createCollaboratorDto.email },
    });

    if (existingCollaborator) {
      throw new HttpException(
        'Collaborator with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    // Create the collaborator, setting createdByUserId from user.id
    const collaborator = this.collaboratorRepository.create({
      ...createCollaboratorDto,
      createdByUserId: user.id, // Use user.id
    });

    const savedCollaborator =
      await this.collaboratorRepository.save(collaborator);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Collaborator created successfully',
      data: savedCollaborator,
    };
  }

  async findAll(): Promise<ApiResponse<Collaborator[]>> {
    const collaborators = await this.collaboratorRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['createdBy'], // Fetch the related 'createdBy' user
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Collaborators retrieved successfully',
      data: collaborators,
    };
  }

  async findAllUser(userId: string): Promise<ApiResponse<Collaborator[]>> {
    const collaborators = await this.collaboratorRepository.find({
      where: { createdByUserId: userId }, // Filter by userId
      order: { createdAt: 'DESC' },
      relations: ['createdBy'], // Fetch the related 'createdBy' user
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Collaborators retrieved successfully',
      data: collaborators,
    };
  }

  async findOne(id: string): Promise<ApiResponse<Collaborator>> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id },
      relations: ['createdBy'], // Fetch related user
    });

    if (!collaborator) {
      throw new HttpException('Collaborator not found', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Collaborator retrieved successfully',
      data: collaborator,
    };
  }

  async findByEmail(email: string): Promise<ApiResponse<Collaborator>> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { email },
      relations: ['createdBy'], // Fetch related user
    });

    if (!collaborator) {
      throw new HttpException('Collaborator not found', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Collaborator retrieved successfully',
      data: collaborator,
    };
  }

  async update(
    id: string,
    updateCollaboratorDto: UpdateCollaboratorDto,
  ): Promise<ApiResponse<Collaborator>> {
    const collaborator = await this.collaboratorRepository.findOne({
      where: { id },
    });

    if (!collaborator) {
      throw new HttpException('Collaborator not found', HttpStatus.NOT_FOUND);
    }

    if (
      updateCollaboratorDto.email &&
      updateCollaboratorDto.email !== collaborator.email
    ) {
      const existingCollaborator = await this.collaboratorRepository.findOne({
        where: { email: updateCollaboratorDto.email },
      });

      if (existingCollaborator) {
        throw new HttpException('Email already in use', HttpStatus.CONFLICT);
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
  }
}

//   async create(
//     createCollaboratorDto: CreateCollaboratorDto,
//   ): Promise<ApiResponse<Collaborator>> {
//     try {
//       const existingCollaborator = await this.collaboratorRepository.findOne({
//         where: { email: createCollaboratorDto.email },
//       });

//       if (existingCollaborator) {
//         return {
//           statusCode: HttpStatus.CONFLICT,
//           message: 'Collaborator with this email already exists',
//           data: existingCollaborator, // Return existing if found
//         };
//       }

//       const collaborator = this.collaboratorRepository.create(
//         createCollaboratorDto,
//       );
//       const savedCollaborator =
//         await this.collaboratorRepository.save(collaborator);

//       return {
//         statusCode: HttpStatus.CREATED,
//         message: 'Collaborator created successfully',
//         data: savedCollaborator,
//       };
//     } catch (error) {
//       this.logger.error(`Failed to create collaborator: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while creating the collaborator',
//         data: null,
//       };
//     }
//   }

//   async findAll(): Promise<ApiResponse<Collaborator[]>> {
//     try {
//       const collaborators = await this.collaboratorRepository.find({
//         order: { createdAt: 'DESC' },
//       });

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborators retrieved successfully',
//         data: collaborators,
//       };
//     } catch (error) {
//       this.logger.error(`Failed to fetch collaborators: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching collaborators',
//         data: [],
//       };
//     }
//   }

//   async findAllUser(userId: string): Promise<ApiResponse<Collaborator[]>> {
//     try {
//       const collaborators = await this.collaboratorRepository.find({
//         where: { createdByUserId: userId }, // Filter by userId
//         order: { createdAt: 'DESC' },
//       });

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborators retrieved successfully',
//         data: collaborators,
//       };
//     } catch (error) {
//       this.logger.error(`Failed to fetch collaborators: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching collaborators',
//         data: [],
//       };
//     }
//   }

//   async findOne(id: string): Promise<ApiResponse<Collaborator>> {
//     try {
//       const collaborator = await this.collaboratorRepository.findOne({
//         where: { id },
//       });

//       if (!collaborator) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Collaborator not found',
//           data: null,
//         };
//       }

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborator retrieved successfully',
//         data: collaborator,
//       };
//     } catch (error) {
//       this.logger.error(`Failed to fetch collaborator: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching the collaborator',
//         data: null,
//       };
//     }
//   }

//   async findByEmail(email: string): Promise<ApiResponse<Collaborator>> {
//     try {
//       const collaborator = await this.collaboratorRepository.findOne({
//         where: { email },
//       });

//       if (!collaborator) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Collaborator not found',
//           data: null,
//         };
//       }

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborator retrieved successfully',
//         data: collaborator,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to fetch collaborator by email: ${error.message}`,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching the collaborator',
//         data: null,
//       };
//     }
//   }

//   async update(
//     id: string,
//     updateCollaboratorDto: UpdateCollaboratorDto,
//   ): Promise<ApiResponse<Collaborator>> {
//     try {
//       const collaborator = await this.collaboratorRepository.findOne({
//         where: { id },
//       });

//       if (!collaborator) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Collaborator not found',
//           data: null,
//         };
//       }

//       if (
//         updateCollaboratorDto.email &&
//         updateCollaboratorDto.email !== collaborator.email
//       ) {
//         const existingCollaborator = await this.collaboratorRepository.findOne({
//           where: { email: updateCollaboratorDto.email },
//         });

//         if (existingCollaborator) {
//           return {
//             statusCode: HttpStatus.CONFLICT,
//             message: 'Email already in use',
//             data: null,
//           };
//         }
//       }

//       Object.assign(collaborator, updateCollaboratorDto);
//       const updatedCollaborator =
//         await this.collaboratorRepository.save(collaborator);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Collaborator updated successfully',
//         data: updatedCollaborator,
//       };
//     } catch (error) {
//       this.logger.error(`Failed to update collaborator: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while updating the collaborator',
//         data: null,
//       };
//     }
//   }
// }
