// import { Injectable, HttpStatus } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { ApiResponse } from 'src/auth/auth.service';
// import {
//   SongCollaborator,
//   CollaboratorRole,
// } from 'src/collaborators/entities/collaborator.entity';
// import { Repository } from 'typeorm';
// import { Logger } from 'winston';

// @Injectable()
// export class SplitSheetService {
//   private readonly logger = new Logger();

//   constructor(
//     @InjectRepository(SongCollaborator)
//     private songCollaboratorRepository: Repository<SongCollaborator>,
//   ) {}

//   async getSplitSheet(songId: string): Promise<
//     ApiResponse<{
//       totalPercentage: number;
//       splits: SongCollaborator[];
//       isComplete: boolean;
//     }>
//   > {
//     try {
//       const splits = await this.songCollaboratorRepository.find({
//         where: { songId },
//         relations: ['collaborator'],
//         order: { createdAt: 'ASC' },
//       });

//       const totalPercentage = splits.reduce(
//         (sum, split) => sum + split.splitPercentage,
//         0,
//       );

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Split sheet retrieved successfully',
//         data: {
//           totalPercentage,
//           splits,
//           isComplete: totalPercentage === 100,
//         },
//       };
//     } catch (error) {
//       this.logger.error(`Failed to get split sheet: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching the split sheet',
//         data: null,
//       };
//     }
//   }

//   async validateSplitSheet(songId: string): Promise<
//     ApiResponse<{
//       isValid: boolean;
//       errors: string[];
//     }>
//   > {
//     try {
//       const splits = await this.songCollaboratorRepository.find({
//         where: { songId },
//         relations: ['collaborator'],
//       });

//       const errors: string[] = [];
//       const totalPercentage = splits.reduce(
//         (sum, split) => sum + split.splitPercentage,
//         0,
//       );

//       if (totalPercentage !== 100) {
//         errors.push(`Total percentage (${totalPercentage}%) must equal 100%`);
//       }

//       if (splits.length === 0) {
//         errors.push('No splits found for this song');
//       }

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Split sheet validation completed',
//         data: {
//           isValid: errors.length === 0,
//           errors,
//         },
//       };
//     } catch (error) {
//       this.logger.error(`Failed to validate split sheet: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while validating the split sheet',
//         data: null,
//       };
//     }
//   }

//   async getSplitSummary(songId: string): Promise<
//     ApiResponse<{
//       totalPercentage: number;
//       roleBreakdown: Record<CollaboratorRole, number>;
//       collaboratorCount: number;
//     }>
//   > {
//     try {
//       const splits = await this.songCollaboratorRepository.find({
//         where: { songId },
//         relations: ['collaborator'],
//       });

//       const roleBreakdown = splits.reduce(
//         (acc, split) => {
//           acc[split.role] = (acc[split.role] || 0) + split.splitPercentage;
//           return acc;
//         },
//         {} as Record<CollaboratorRole, number>,
//       );

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Split summary retrieved successfully',
//         data: {
//           totalPercentage: splits.reduce(
//             (sum, split) => sum + split.splitPercentage,
//             0,
//           ),
//           roleBreakdown,
//           collaboratorCount: splits.length,
//         },
//       };
//     } catch (error) {
//       this.logger.error(`Failed to get split summary: ${error.message}`);
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching the split summary',
//         data: null,
//       };
//     }
//   }
// }
