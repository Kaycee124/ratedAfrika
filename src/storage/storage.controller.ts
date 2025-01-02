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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import { StorageService } from './services/storage.service';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UploadFileDto, InitiateMultipartUploadDto } from './dto/upload.dto';
import { memoryStorage } from 'multer';

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'audio/mpeg',
          'audio/wav',
          'image/jpeg',
          'image/png',
          'image/gif',
          'video/mp4',
          'video/quicktime',
        ];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type'), false);
        }
        cb(null, true);
      },
    }),
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
      return await this.storageService.uploadFile(file, req.user, {
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

  @Post('multipart/:uploadId/chunk/:chunkNumber')
  @UseInterceptors(
    FileInterceptor('chunk', {
      storage: memoryStorage(),
    }),
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
      return await this.storageService.uploadChunk(
        uploadId,
        Number(chunkNumber),
        file.buffer,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload chunk: ${error.message}`,
      );
    }
  }

  @Get(':fileId/url')
  async getSignedUrl(@Param('fileId') fileId: string, @Request() req) {
    try {
      return await this.storageService.getSignedUrl(fileId, req.user);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get signed URL: ${error.message}`,
      );
    }
  }
}
