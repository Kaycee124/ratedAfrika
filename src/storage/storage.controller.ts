// // src/infrastructure/storage/storage.controller.ts
// import {
//   Controller,
//   Post,
//   UseGuards,
//   UseInterceptors,
//   UploadedFile,
//   Body,
//   Param,
//   Get,
//   Request,
//   ParseFilePipe,
//   MaxFileSizeValidator,
//   FileTypeValidator,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
// import { StorageService } from './services/storage.service';
// import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
// import { UploadFileDto, InitiateMultipartUploadDto } from './dto/upload.dto';

// @ApiTags('storage')
// @Controller('storage')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth()
// export class StorageController {
//   constructor(private readonly storageService: StorageService) {}

//   @Post('upload')
//   @UseInterceptors(FileInterceptor('file'))
//   @ApiConsumes('multipart/form-data')
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         file: {
//           type: 'string',
//           format: 'binary',
//         },
//         type: {
//           enum: ['audio', 'image', 'video'],
//         },
//         isPublic: {
//           type: 'boolean',
//         },
//         metadata: {
//           type: 'object',
//         },
//       },
//     },
//   })
//   async uploadFile(
//     @UploadedFile(
//       new ParseFilePipe({
//         validators: [
//           new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
//           new FileTypeValidator({
//             fileType: new RegExp('.(jpg|jpeg|png|gif|mp3|wav|mp4|mov)$', 'i'),
//           }),
//         ],
//       }),
//     )
//     file: Express.Multer.File,
//     @Body() uploadFileDto: UploadFileDto,
//     @Request() req,
//   ) {
//     return this.storageService.uploadFile(file, req.user, {
//       type: uploadFileDto.type,
//       isPublic: uploadFileDto.isPublic,
//       metadata: uploadFileDto.metadata,
//     });
//   }

//   @Post('multipart/initiate')
//   async initiateMultipartUpload(
//     @Body() dto: InitiateMultipartUploadDto,
//     @Request() req,
//   ) {
//     return this.storageService.initiateMultipartUpload(
//       dto.metadata?.filename || 'unnamed',
//       dto.chunkConfig.totalSize,
//       req.user,
//       {
//         type: dto.type,
//         isPublic: dto.isPublic,
//         metadata: dto.metadata,
//       },
//     );
//   }

//   @Post('multipart/:uploadId/chunk/:chunkNumber')
//   @UseInterceptors(FileInterceptor('chunk'))
//   async uploadChunk(
//     @Param('uploadId') uploadId: string,
//     @Param('chunkNumber') chunkNumber: number,
//     @UploadedFile() file: Express.Multer.File,
//   ) {
//     return this.storageService.uploadChunk(
//       uploadId,
//       Number(chunkNumber),
//       file.buffer,
//     );
//   }

//   @Get(':fileId/url')
//   async getSignedUrl(@Param('fileId') fileId: string, @Request() req) {
//     return this.storageService.getSignedUrl(fileId, req.user);
//   }
// }
import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Get,
  Request,
  BadRequestException,
  InternalServerErrorException,
  Query,
  Res,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import { StorageService } from './services/storage.service';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UploadFileDto, InitiateMultipartUploadDto } from './dto/upload.dto';

import { ApiResponse as AuthApiResponse } from 'src/auth/auth.service';
import { FileBase } from './entities/file-base.entity';
import { Response } from 'express';
import { Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { Throttle } from '@nestjs/throttler';

// Create a separate controller for public file access
@ApiTags('public-storage')
@Controller('storage')
export class PublicStorageController {
  private readonly logger = new Logger(PublicStorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Get('files/:fileId')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // Rate limit: 60 requests per minute
  @ApiOperation({ summary: 'Get file content (public)' })
  @ApiParam({ name: 'fileId', description: 'File ID' })
  @ApiResponse({
    status: 200,
    description: 'File content retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getPublicFile(@Param('fileId') fileId: string, @Res() res: Response) {
    try {
      const file = await this.storageService.getFile(fileId);
      if (!file) {
        throw new NotFoundException('File not found');
      }

      // Get file metadata for headers
      const fileMetadata = await this.storageService.getFileMetadata(
        fileId,
        null,
      );
      if (!fileMetadata) {
        throw new NotFoundException('File metadata not found');
      }

      // Set appropriate headers
      res.setHeader('Content-Type', fileMetadata.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${fileMetadata.filename}"`,
      );

      // Stream the file
      if (file instanceof Readable) {
        // COMMENTED OUT: This code causes server crashes when files don't exist
        // Problem: fs.createReadStream() emits unhandled 'error' events for missing files (ENOENT)
        // Impact: Unhandled stream errors crash the entire Node.js process
        // Symptom: Browser reports "CORS error" because server crash = no response headers
        // file.pipe(res);

        // FIX: Add error handling to prevent server crashes
        file.on('error', (streamError: any) => {
          this.logger.error(
            `File stream error: ${streamError.message}`,
            streamError.stack,
          );

          // Prevent duplicate responses if headers already sent
          if (!res.headersSent) {
            // Handle specific file system errors gracefully
            if (streamError.code === 'ENOENT') {
              res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: 'File not found on storage',
              });
            } else {
              res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Error reading file',
              });
            }
          }
        });

        // Safe pipe: errors are now handled, won't crash server
        file.pipe(res);
      } else {
        res.send(file);
      }
    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`, error.stack);

      // ADDED: Handle specific file not found errors gracefully instead of crashing
      if (
        (error as any).code === 'ENOENT' ||
        error.message.includes('ENOENT')
      ) {
        throw new NotFoundException('File not found on storage');
      }

      throw error;
    }
  }
}

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(
    // Use MulterModule registered config (diskStorage to LOCAL_STORAGE_PATH/tmp)
    FileInterceptor('file'),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          enum: ['audio', 'image', 'video'],
        },
        isPublic: {
          type: 'boolean',
        },
        metadata: {
          type: 'object',
        },
        forceMultipart: {
          type: 'boolean',
          description: 'Force multipart upload regardless of file size',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      //Implementing INDUSTRY STANDARD: Auto-switch to multipart for files >50MB
      const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB
      const shouldUseMultipart =
        (uploadFileDto as any).forceMultipart ||
        file.size > MULTIPART_THRESHOLD;

      if (shouldUseMultipart) {
        // Redirect to multipart flow - return initiation response
        const uploadId = await this.storageService.initiateMultipartUpload(
          file.originalname,
          file.size,
          req.user,
          {
            type: uploadFileDto.type,
            isPublic: uploadFileDto.isPublic,
            metadata: {
              ...uploadFileDto.metadata,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            },
          },
        );

        return {
          multipart: true,
          uploadId,
          chunkSize: 5 * 1024 * 1024, // 5MB chunks
          totalChunks: Math.ceil(file.size / (5 * 1024 * 1024)),
          message: 'File size exceeds 50MB. Use multipart upload endpoints.',
          nextStep: `POST /storage/multipart/${uploadId}/part/1 with first chunk`,
        };
      }

      // Standard single-file upload for files <=50MB
      return await this.storageService.uploadFileFromDisk(file, req.user, {
        type: uploadFileDto.type,
        isPublic: uploadFileDto.isPublic,
        metadata: {
          ...uploadFileDto.metadata,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(`Upload failed: ${error.message}`);
    }
  }

  @Post('multipart/initiate')
  async initiateMultipartUpload(
    @Body() dto: InitiateMultipartUploadDto,
    @Request() req,
  ) {
    try {
      return await this.storageService.initiateMultipartUpload(
        dto.metadata?.filename || 'unnamed',
        dto.chunkConfig.totalSize,
        req.user,
        {
          type: dto.type,
          isPublic: dto.isPublic,
          metadata: dto.metadata,
        },
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to initiate upload: ${error.message}`,
      );
    }
  }

  @Post('multipart/:uploadId/part/:chunkNumber')
  @UseInterceptors(
    // FIXED: Use disk storage for chunks too, not memory
    FileInterceptor('chunk'),
  )
  async uploadChunk(
    @Param('uploadId') uploadId: string,
    @Param('chunkNumber') chunkNumber: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No chunk data provided');
    }

    try {
      // Use uploadChunkFromDisk to stream from temp file
      return await this.storageService.uploadChunkFromDisk(
        uploadId,
        Number(chunkNumber),
        file, // Pass the full file object with path
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload chunk: ${error.message}`,
      );
    }
  }

  @Post('multipart/:uploadId/complete')
  async completeMultipartUpload(
    @Param('uploadId') uploadId: string,
    @Body()
    completeDto: {
      parts: { PartNumber: number; ETag: string }[];
      type: 'audio' | 'image' | 'video';
      metadata?: any;
    },
    @Request() req,
  ) {
    try {
      return await this.storageService.completeMultipartUpload(
        uploadId,
        completeDto.parts,
        completeDto.type,
        completeDto.metadata,
        req.user,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to complete upload: ${error.message}`,
      );
    }
  }

  @Post('multipart/:uploadId/abort')
  async abortMultipartUpload(
    @Param('uploadId') uploadId: string,
    @Request() req,
  ) {
    try {
      await this.storageService.abortMultipartUpload(uploadId, req.user);
      return { message: 'Multipart upload aborted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to abort upload: ${error.message}`,
      );
    }
  }

  @Get(':fileId/url')
  async getSignedUrl(@Param('fileId') fileId: string, @Request() req) {
    try {
      return await this.storageService.getSignedUrl(fileId, req.user);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get upload details by ID' })
  @ApiParam({ name: 'id', description: 'Upload ID' })
  @ApiQuery({
    name: 'type',
    enum: ['audio', 'image', 'video'],
    required: true,
    description: 'Type of upload to retrieve',
  })
  async getUpload(
    @Param('id') id: string,
    @Query('type') type?: string,
  ): Promise<AuthApiResponse<FileBase>> {
    // Check if type parameter is missing
    if (!type) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'File type parameter is required',
        data: null,
      };
    }

    // Validate file type
    const validTypes = ['audio', 'image', 'video'];
    if (!validTypes.includes(type)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid file type specified',
        data: null,
      };
    }

    try {
      return await this.storageService.getUploadById(
        id,
        type as 'audio' | 'image' | 'video',
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve upload details: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve upload details',
        data: null,
      };
    }
  }
}
