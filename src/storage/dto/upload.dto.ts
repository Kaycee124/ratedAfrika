// src/infrastructure/storage/dto/upload.dto.ts
import { IsEnum, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export enum FileType {
  AUDIO = 'audio',
  IMAGE = 'image',
  VIDEO = 'video',
}

export class UploadFileDto {
  @IsEnum(FileType)
  type: FileType;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  isPublic?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'boolean') return value;
    return undefined;
  })
  forceMultipart?: boolean;
}

export class InitiateMultipartUploadDto extends UploadFileDto {
  @IsOptional()
  @IsObject()
  chunkConfig?: {
    chunkSize?: number;
    totalSize: number;
  };
}

export class UploadChunkDto {
  @IsEnum(FileType)
  type: FileType;

  chunkNumber: number;
  totalChunks: number;
}

export class CompleteMultipartUploadDto {
  @IsEnum(FileType)
  type: FileType;

  parts: { PartNumber: number; ETag: string }[];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
