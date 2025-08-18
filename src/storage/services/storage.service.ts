/* eslint-disable @typescript-eslint/no-unused-vars */
// src/infrastructure/storage/services/storage.service.ts
import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import {
  FileBase,
  FileStatus,
  FileValidationStatus,
} from '../entities/file-base.entity';
import {
  AudioFile,
  AudioFormat,
  AudioQuality,
} from '../entities/audio-file.entity';
import {
  ImageFile,
  ImageFormat,
  ImageSize,
} from '../entities/image-file.entity';
import {
  VideoFile,
  VideoFormat,
  VideoQuality,
} from '../entities/video-file.entity';
import { FileChunk } from '../entities/file-chunk.entity';
import { User } from 'src/users/user.entity';
import * as fs from 'fs';
import * as os from 'os';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import path, { join } from 'path';
import { LocalStorageProvider } from '../providers/local-storage.provider';
import { S3StorageProvider } from '../providers/s3-storage.provider';
import { FileValidationService } from './file-validation.service';
import { ApiResponse } from 'src/auth/auth.service';
import { Readable } from 'stream';
import { DownloadOptions } from '../interfaces/storage-provider.interface';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @InjectRepository(FileBase)
    private readonly fileRepository: Repository<FileBase>,
    @InjectRepository(AudioFile)
    private readonly audioFileRepository: Repository<AudioFile>,
    @InjectRepository(ImageFile)
    private readonly imageFileRepository: Repository<ImageFile>,
    @InjectRepository(VideoFile)
    private readonly videoFileRepository: Repository<VideoFile>,
    @InjectRepository(FileChunk)
    private readonly fileChunkRepository: Repository<FileChunk>,
    @Inject('STORAGE_PROVIDER')
    private readonly provider: StorageProvider,
    private readonly fileValidationService: FileValidationService,
  ) {}

  private getMimeTypeFormat(
    mimeType: string,
  ): AudioFormat | ImageFormat | VideoFormat {
    // First, try to get format from MIME type
    const mimeTypeLower = mimeType?.toLowerCase() || '';

    // Video formats
    if (mimeTypeLower.includes('video/mp4')) return VideoFormat.MP4;
    if (mimeTypeLower.includes('video/quicktime')) return VideoFormat.MOV;
    if (mimeTypeLower.includes('video/x-msvideo')) return VideoFormat.AVI;
    if (mimeTypeLower.includes('video/x-matroska')) return VideoFormat.MKV;
    if (mimeTypeLower.includes('video/webm')) return VideoFormat.WEBM;

    // Audio formats
    if (mimeTypeLower.includes('audio/mpeg')) return AudioFormat.MP3;
    if (mimeTypeLower.includes('audio/wav')) return AudioFormat.WAV;
    if (mimeTypeLower.includes('audio/flac')) return AudioFormat.FLAC;
    if (mimeTypeLower.includes('audio/aac')) return AudioFormat.AAC;
    if (mimeTypeLower.includes('audio/ogg')) return AudioFormat.OGG;

    // Image formats
    if (mimeTypeLower.includes('image/jpeg')) return ImageFormat.JPEG;
    if (mimeTypeLower.includes('image/png')) return ImageFormat.PNG;
    if (mimeTypeLower.includes('image/gif')) return ImageFormat.GIF;
    if (mimeTypeLower.includes('image/webp')) return ImageFormat.WEBP;
    if (mimeTypeLower.includes('image/svg+xml')) return ImageFormat.SVG;

    // If no MIME type match, try to determine from filename extension
    const ext = path.extname(mimeTypeLower).toLowerCase();

    // Video extensions
    if (ext === '.mp4') return VideoFormat.MP4;
    if (ext === '.mov') return VideoFormat.MOV;
    if (ext === '.avi') return VideoFormat.AVI;
    if (ext === '.mkv') return VideoFormat.MKV;
    if (ext === '.webm') return VideoFormat.WEBM;

    // Audio extensions
    if (ext === '.mp3') return AudioFormat.MP3;
    if (ext === '.wav') return AudioFormat.WAV;
    if (ext === '.flac') return AudioFormat.FLAC;
    if (ext === '.aac') return AudioFormat.AAC;
    if (ext === '.ogg') return AudioFormat.OGG;

    // Image extensions
    if (ext === '.jpg' || ext === '.jpeg') return ImageFormat.JPEG;
    if (ext === '.png') return ImageFormat.PNG;
    if (ext === '.gif') return ImageFormat.GIF;
    if (ext === '.webp') return ImageFormat.WEBP;
    if (ext === '.svg') return ImageFormat.SVG;

    throw new Error(`Unsupported file type: ${mimeType}`);
  }
  // helper function for multipart upload
  private getMimeType(
    filename: string,
    type: 'audio' | 'image' | 'video',
  ): string {
    const extension = filename.toLowerCase().split('.').pop() || '';

    const mimeTypes = {
      audio: {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        flac: 'audio/flac',
        aac: 'audio/aac',
        ogg: 'audio/ogg',
      },
      image: {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      },
      video: {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        mkv: 'video/x-matroska',
        webm: 'video/webm',
      },
    };

    return (
      mimeTypes[type][extension] ||
      mimeTypes[type][Object.keys(mimeTypes[type])[0]]
    ); // Default to first mime type of the category
  }

  // uploiad the file
  async uploadFile(
    file: Express.Multer.File,
    user: User,
    options: {
      type: 'audio' | 'image' | 'video';
      metadata?: Record<string, any>;
      isPublic?: boolean;
    },
  ): Promise<FileBase> {
    let uploadedFileKey: string | null = null;

    try {
      let fileEntity: FileBase;
      const repository = this.getRepositoryForType(options.type);

      // STEP 1: Upload to storage provider FIRST
      const { key } = await this.provider.upload(
        file.originalname,
        file.buffer,
        {
          contentType: file.mimetype,
          isPublic: options.isPublic,
          metadata: options.metadata,
        },
      );
      uploadedFileKey = key; // Track for cleanup if database fails

      // STEP 2: Prepare entity with final path (single save approach)
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const baseProps = {
        filename: file.originalname,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: '', // Will be set after getting ID
        bucket: process.env.STORAGE_BUCKET || 'default-bucket',
        key: key,
        uploadedBy: user,
        metadata: options.metadata || {},
        isPublic: options.isPublic || false,
        status: FileStatus.PENDING,
      };

      const format = this.getMimeTypeFormat(file.mimetype);

      switch (options.type) {
        case 'audio':
          fileEntity = this.audioFileRepository.create({
            ...baseProps,
            format: format as AudioFormat,
            quality: AudioQuality.MASTER,
            duration: 0,
            bitrate: 0,
            sampleRate: 0,
            channels: 0,
          });
          break;

        case 'image':
          fileEntity = this.imageFileRepository.create({
            ...baseProps,
            format: format as ImageFormat,
            sizeType: ImageSize.ORIGINAL,
            width: 0,
            height: 0,
          });
          break;

        case 'video':
          fileEntity = this.videoFileRepository.create({
            ...baseProps,
            format: format as VideoFormat,
            quality: VideoQuality.MASTER,
            duration: 0,
            width: 0,
            height: 0,
            frameRate: 0,
            bitrate: 0,
          });
          break;

        default:
          throw new Error(`Unsupported file type: ${options.type}`);
      }

      // STEP 3: Save to database (first save)
      const savedEntity = await repository.save(fileEntity);

      // STEP 4: Update path and save again (risky part - can fail)
      savedEntity.path = `${baseUrl}/storage/files/${savedEntity.id}`;
      await repository.save(savedEntity);

      return savedEntity;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);

      // CRITICAL FIX: Clean up uploaded file if database operation failed
      if (uploadedFileKey) {
        try {
          await this.provider.delete(uploadedFileKey);
          this.logger.warn(`Cleaned up orphaned file: ${uploadedFileKey}`);
        } catch (deleteError) {
          this.logger.error(
            `Failed to clean up file ${uploadedFileKey}: ${deleteError.message}`,
          );
        }
      }

      throw error;
    }
  }

  // Stream from disk (multer saved to LOCAL_STORAGE_PATH/tmp) to the storage provider
  async uploadFileFromDisk(
    file: Express.Multer.File,
    user: User,
    options: {
      type: 'audio' | 'image' | 'video';
      metadata?: Record<string, any>;
      isPublic?: boolean;
    },
  ): Promise<FileBase & { url: string }> {
    let uploadedFileKey: string | null = null;
    let tempFilePath: string | null = file.path; // Track Multer's temp file

    try {
      const repository = this.getRepositoryForType(options.type);

      // Build a stable key for the stored object
      const originalExt = (
        file.originalname.match(/\.[^.]+$/)?.[0] || ''
      ).toLowerCase();
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}${originalExt}`;

      // Create a readable stream from the temp file path
      const fs = await import('fs');
      const stream = fs.createReadStream(file.path);

      await this.provider.uploadStream(key, stream as unknown as any, {
        contentType: file.mimetype,
        isPublic: options.isPublic,
        metadata: options.metadata,
      });
      uploadedFileKey = key;

      // CRITICAL FIX: Delete Multer's temporary file immediately after successful stream
      await fs.promises.unlink(file.path);
      tempFilePath = null; // Mark as deleted

      const entityBase = {
        filename: file.originalname,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key,
        bucket: process.env.STORAGE_BUCKET || 'local',
        uploadedBy: user,
        metadata: options.metadata || {},
        isPublic: !!options.isPublic,
        status: FileStatus.PENDING,
      } as Partial<FileBase>;

      let entity: FileBase;
      switch (options.type) {
        case 'audio':
          entity = this.audioFileRepository.create(entityBase as any) as any;
          break;
        case 'image':
          entity = this.imageFileRepository.create(entityBase as any) as any;
          break;
        case 'video':
          entity = this.videoFileRepository.create(entityBase as any) as any;
          break;
        default:
          throw new Error(`Unsupported file type: ${options.type}`);
      }

      const saved = await repository.save(entity);

      // Derive URL at response time (do not persist absolute URL)
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/storage/files/${saved.id}`;
      return { ...(saved as any), url };
    } catch (error) {
      this.logger.error(
        `Failed to upload file from disk: ${error.message}`,
        error.stack,
      );

      // COMPREHENSIVE CLEANUP: Clean up both storage provider and Multer temp file
      if (uploadedFileKey) {
        try {
          await this.provider.delete(uploadedFileKey);
          this.logger.warn(`Cleaned up orphaned file: ${uploadedFileKey}`);
        } catch (deleteError) {
          this.logger.error(
            `Failed to clean up file ${uploadedFileKey}: ${(deleteError as any).message}`,
          );
        }
      }

      // Clean up Multer's temporary file if it still exists
      if (tempFilePath) {
        try {
          const fs = await import('fs');
          await fs.promises.unlink(tempFilePath);
          this.logger.warn(`Cleaned up temp file: ${tempFilePath}`);
        } catch (unlinkError) {
          this.logger.warn(
            `Failed to clean up temp file: ${(unlinkError as any).message}`,
          );
        }
      }

      throw error;
    }
  }

  // multipart upload initiate

  async initiateMultipartUpload(
    filename: string,
    totalSize: number,
    user: User,
    options: {
      type: 'audio' | 'image' | 'video';
      metadata?: Record<string, any>;
      isPublic?: boolean;
    },
  ): Promise<string> {
    try {
      if (!filename || !totalSize) {
        throw new BadRequestException('Filename and size are required');
      }

      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const repository = this.getRepositoryForType(options.type);

      // Generate storage paths
      const tempKey = `temp_${uploadId}/${filename}`;
      const tempPath =
        this.provider instanceof LocalStorageProvider
          ? join(this.provider.getBasePath(), tempKey)
          : `https://${process.env.STORAGE_BUCKET || 'your-bucket'}.s3.${process.env.AWS_REGION}.amazonaws.com/${tempKey}`;

      // Determine MIME type and format
      const mimeType = this.getMimeType(filename, options.type);
      const format = this.getMimeTypeFormat(mimeType);

      // Base properties for all file types
      const baseProps = {
        // Required base fields
        filename,
        originalFilename: filename,
        mimeType,
        size: totalSize,
        path: tempPath,
        bucket: process.env.STORAGE_BUCKET || 'default-bucket',
        key: tempKey,
        storageKey: `${process.env.STORAGE_BUCKET}/${uploadId}/${filename}`,

        // Status fields
        status: FileStatus.PENDING,
        validationStatus: FileValidationStatus.PENDING,

        // Metadata
        metadata: {
          ...options.metadata,
          mimeType,
          uploadedAt: new Date().toISOString(),
          fileType: options.type,
        },

        // Results fields (initialize as empty objects)
        validationResults: {},
        processingResults: {},

        // Access control
        isPublic: options.isPublic ?? false,
        uploadedBy: user,

        // Tracking fields
        downloadCount: 0,
        lastAccessedAt: new Date(),
      };

      let fileEntity: FileBase;

      switch (options.type) {
        case 'audio':
          fileEntity = this.audioFileRepository.create({
            ...baseProps,
            format: format as AudioFormat,
            quality: AudioQuality.MASTER,
            duration: 0,
            bitrate: 0,
            sampleRate: 0,
            channels: 0,
            waveform: [],
            loudness: 0,
            spectrum: {
              frequencies: [],
              magnitudes: [],
            },
            encoderSettings: '',
            analysis: {
              peakAmplitude: 0,
              dynamicRange: 0,
              clipCount: 0,
              silenceStart: [],
              silenceEnd: [],
              bpm: 0,
              key: '',
            },
            hasClipping: false,
            isNormalized: false,
          });
          break;

        case 'image':
          fileEntity = this.imageFileRepository.create({
            ...baseProps,
            format: format as ImageFormat,
            sizeType: ImageSize.ORIGINAL,
            width: 0,
            height: 0,
            dpi: 72,
            colorSpace: 'RGB',
            bitDepth: 24,
            hasAlpha: false,
            colorProfile: {
              name: 'sRGB',
              description: 'Standard RGB color space',
              metadata: {},
            },
            compression: {
              type: 'none',
              quality: 100,
              ratio: 1,
            },
            analysis: {
              dominantColors: [],
              averageColor: '#FFFFFF',
              brightness: 0,
              contrast: 0,
              sharpness: 0,
            },
          });
          break;

        case 'video':
          fileEntity = this.videoFileRepository.create({
            ...baseProps,
            format: format as VideoFormat,
            quality: VideoQuality.MASTER,
            duration: 0,
            width: 0,
            height: 0,
            frameRate: 0,
            bitrate: 0,
            videoStream: {
              codec: 'pending',
              bitrate: 0,
              frameRate: 0,
              profile: 'main',
              keyframeInterval: 0,
            },
            audioStream: {
              codec: 'pending',
              bitrate: 0,
              sampleRate: 44100,
              channels: 2,
            },
            encodingSettings: {
              preset: 'medium',
              crf: 23,
              pixelFormat: 'yuv420p',
              colorSpace: 'bt709',
              profile: 'high',
            },
            metadata: {
              title: filename,
              description: '',
              tags: [],
              copyright: '',
              creationDate: new Date(),
            },
            analysis: {
              averageBitrate: 0,
              maxBitrate: 0,
              qualityMetrics: {
                psnr: 0,
                ssim: 0,
                vmaf: 0,
              },
              sceneChanges: [],
              blackFrames: [],
              audioLevels: {
                peak: 0,
                average: 0,
              },
            },
            thumbnailKey: '',
            masterVersionId: null,
            versions: [],
          } as DeepPartial<VideoFile>);

          break;

        default:
          throw new BadRequestException(
            `Unsupported file type: ${options.type}`,
          );
      }

      // First, ensure the file entity is saved
      const savedEntity = await repository.save(fileEntity);

      // Then calculate chunk information
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(totalSize / chunkSize);

      // Create the file chunks with proper references
      await Promise.all(
        Array.from({ length: totalChunks }, (_, i) =>
          this.fileChunkRepository.save({
            uploadId,
            chunkNumber: i + 1,
            totalChunks,
            chunkSize,
            file: { id: savedEntity.id }, // Explicitly reference the file by ID
            storageKey: `${savedEntity.storageKey}_part${i + 1}`, // Use consistent naming
            uploaded: false,
            metadata: {
              partNumber: i + 1,
              size: Math.min(chunkSize, totalSize - i * chunkSize), // Handle last chunk size
              etag: null,
              checksum: null,
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry
            error: null,
          }),
        ),
      );

      return uploadId;
    } catch (error) {
      this.logger.error(
        `Failed to initiate multipart upload: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async uploadChunk(
    uploadId: string,
    chunkNumber: number,
    chunkData: Buffer,
  ): Promise<void> {
    try {
      const chunk = await this.fileChunkRepository.findOne({
        where: { uploadId, chunkNumber },
        relations: ['file'],
      });

      if (!chunk) {
        throw new Error(`Chunk not found: ${uploadId} - ${chunkNumber}`);
      }

      const key = `${chunk.file.key}_chunk${chunkNumber}`;
      const result = await this.provider.upload(key, chunkData);

      chunk.uploaded = true;
      chunk.metadata = {
        etag: result.key,
        size: chunkData.length,
      };

      await this.fileChunkRepository.save(chunk);

      const allChunks = await this.fileChunkRepository.find({
        where: { uploadId },
      });

      if (allChunks.every((c) => c.uploaded)) {
        await this.finalizeMultipartUpload(uploadId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to upload chunk: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ADDED: Stream-based chunk upload (industry standard for large files)
  async uploadChunkFromDisk(
    uploadId: string,
    chunkNumber: number,
    file: Express.Multer.File,
  ): Promise<{ PartNumber: number; ETag: string }> {
    let tempFilePath: string | null = file.path;

    try {
      const chunk = await this.fileChunkRepository.findOne({
        where: { uploadId, chunkNumber },
        relations: ['file'],
      });

      if (!chunk) {
        throw new BadRequestException(
          `Chunk not found: ${uploadId} - ${chunkNumber}`,
        );
      }

      // Stream chunk from disk to storage provider
      const chunkKey = `${chunk.file.key}_chunk${chunkNumber}`;
      const fs = await import('fs');
      const stream = fs.createReadStream(file.path);

      await this.provider.uploadStream(chunkKey, stream as unknown as any, {
        contentType: 'application/octet-stream',
        metadata: { uploadId, chunkNumber: chunkNumber.toString() },
      });

      // Clean up temp file immediately
      await fs.promises.unlink(file.path);
      tempFilePath = null;

      // Update chunk metadata
      chunk.uploaded = true;
      chunk.metadata = {
        ...chunk.metadata,
        etag: chunkKey,
        size: file.size,
      };

      await this.fileChunkRepository.save(chunk);

      return {
        PartNumber: chunkNumber,
        ETag: chunkKey,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload chunk from disk: ${error.message}`,
        error.stack,
      );

      // Clean up temp file if it still exists
      if (tempFilePath) {
        try {
          const fs = await import('fs');
          await fs.promises.unlink(tempFilePath);
        } catch (unlinkError) {
          this.logger.warn(
            `Failed to clean up temp chunk file: ${unlinkError.message}`,
          );
        }
      }

      throw error;
    }
  }

  // ADDED: Manual completion of multipart upload (called by frontend)
  async completeMultipartUpload(
    uploadId: string,
    parts: { PartNumber: number; ETag: string }[],
    fileType: 'audio' | 'image' | 'video',
    metadata: any,
    user: any,
  ): Promise<FileBase & { url: string }> {
    try {
      const chunks = await this.fileChunkRepository.find({
        where: { uploadId },
        relations: ['file'],
        order: { chunkNumber: 'ASC' },
      });

      if (!chunks.length) {
        throw new BadRequestException(
          `No chunks found for upload ID: ${uploadId}`,
        );
      }

      // Verify all parts are uploaded
      const missingParts = parts.filter(
        (part) =>
          !chunks.find(
            (chunk) => chunk.chunkNumber === part.PartNumber && chunk.uploaded,
          ),
      );

      if (missingParts.length > 0) {
        throw new BadRequestException(
          `Missing chunks: ${missingParts.map((p) => p.PartNumber).join(', ')}`,
        );
      }

      const file = chunks[0].file;
      const finalKey = file.key.replace('temp_', ''); // Remove temp prefix

      // Combine chunks based on storage provider
      if (this.provider instanceof LocalStorageProvider) {
        await this.combineChunksLocally(
          chunks,
          this.provider.getBasePath() + '/' + finalKey,
        );
      } else if (this.provider instanceof S3StorageProvider) {
        await this.provider.completeMultipartUpload(finalKey, uploadId, parts);
      } else {
        throw new Error('Unsupported storage provider for multipart upload');
      }

      // Update file with final details
      file.key = finalKey;
      file.status = FileStatus.COMPLETE;
      file.metadata = { ...file.metadata, ...metadata };

      const repository = this.getRepositoryForType(fileType);
      const savedFile = await repository.save(file);

      // Clean up chunks
      await Promise.all(chunks.map((chunk) => this.deleteChunk(chunk)));
      await this.fileChunkRepository.remove(chunks);

      // Derive URL at response time
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/storage/files/${savedFile.id}`;

      this.logger.log(`Successfully completed multipart upload: ${uploadId}`);
      return { ...(savedFile as any), url };
    } catch (error) {
      this.logger.error(
        `Failed to complete multipart upload: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ADDED: Abort multipart upload
  async abortMultipartUpload(uploadId: string, user: any): Promise<void> {
    try {
      const chunks = await this.fileChunkRepository.find({
        where: { uploadId },
        relations: ['file'],
      });

      if (!chunks.length) {
        this.logger.warn(`No chunks found for upload ID: ${uploadId}`);
        return;
      }

      const file = chunks[0].file;

      // Clean up storage provider
      if (this.provider instanceof S3StorageProvider) {
        await this.provider.abortMultipartUpload(file.key, uploadId);
      }

      // Clean up individual chunks
      await Promise.all(chunks.map((chunk) => this.deleteChunk(chunk)));

      // Remove database entries
      await this.fileChunkRepository.remove(chunks);
      await this.fileRepository.remove(file);

      this.logger.log(`Successfully aborted multipart upload: ${uploadId}`);
    } catch (error) {
      this.logger.error(
        `Failed to abort multipart upload: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async finalizeMultipartUpload(uploadId: string): Promise<void> {
    try {
      const chunks = await this.fileChunkRepository.find({
        where: { uploadId },
        relations: ['file'],
        order: { chunkNumber: 'ASC' },
      });

      if (!chunks.length) {
        throw new Error(`No chunks found for upload ID: ${uploadId}`);
      }

      const file = chunks[0].file;
      const finalPath =
        this.provider instanceof LocalStorageProvider
          ? join(this.provider.getBasePath(), file.key)
          : file.key;

      if (this.provider instanceof LocalStorageProvider) {
        await this.combineChunksLocally(chunks, finalPath);
      } else if (this.provider instanceof S3StorageProvider) {
        await this.combineChunksS3(chunks, file.key);
      } else {
        throw new Error('Unsupported storage provider for multipart upload');
      }

      // Update file status and trigger validation
      file.status = FileStatus.COMPLETE;
      await this.fileRepository.save(file);

      // Trigger appropriate validation based on file type
      // if (file instanceof AudioFile) {
      //   void this.fileValidationService.validateAudioFile(file);
      // } else if (file instanceof ImageFile) {
      //   void this.fileValidationService.validateImageFile(file);
      // } else if (file instanceof VideoFile) {
      //   void this.fileValidationService.validateVideoFile(file);
      // }

      // Clean up chunks
      await Promise.all(chunks.map((chunk) => this.deleteChunk(chunk)));
      await this.fileChunkRepository.remove(chunks);

      this.logger.log(`Successfully finalized multipart upload: ${uploadId}`);
    } catch (error) {
      this.logger.error(
        `Failed to finalize multipart upload: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async deleteChunk(chunk: FileChunk): Promise<void> {
    try {
      if (this.provider instanceof LocalStorageProvider) {
        const chunkPath = join(
          this.provider.getBasePath(),
          `${chunk.file.key}_chunk${chunk.chunkNumber}`,
        );
        await fs.promises.unlink(chunkPath).catch(() => {});
      } else if (this.provider instanceof S3StorageProvider) {
        await this.provider
          .deleteObject(`${chunk.file.key}_chunk${chunk.chunkNumber}`)
          .catch(() => {});
      }
    } catch (error) {
      this.logger.warn(`Failed to delete chunk: ${error.message}`);
    }
  }

  private async combineChunksLocally(
    chunks: FileChunk[],
    finalPath: string,
  ): Promise<void> {
    await fs.promises.mkdir(path.dirname(finalPath), { recursive: true });
    const writeStream = createWriteStream(finalPath);

    try {
      for (const chunk of chunks) {
        const chunkPath = join(
          path.dirname(finalPath),
          `${chunks[0].file.key}_chunk${chunk.chunkNumber}`,
        );

        await fs.promises.access(chunkPath);
        const readStream = createReadStream(chunkPath);
        await pipeline(readStream, writeStream, { end: false });
      }

      writeStream.end();
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } catch (error) {
      writeStream.destroy();
      await fs.promises.unlink(finalPath).catch(() => {});
      throw error;
    }
  }

  private async combineChunksS3(
    chunks: FileChunk[],
    finalKey: string,
  ): Promise<void> {
    if (!(this.provider instanceof S3StorageProvider)) {
      throw new Error('Invalid provider for S3 chunk combining');
    }

    const uploadId = await this.provider.initiateMultipartUpload(finalKey);

    try {
      const parts = await Promise.all(
        chunks.map(async (chunk, index) => {
          const chunkKey = `${finalKey}_chunk${chunk.chunkNumber}`;
          return await this.provider.uploadPart(
            finalKey,
            uploadId,
            index + 1,
            chunkKey,
          );
        }),
      );

      await this.provider.completeMultipartUpload(finalKey, uploadId, parts);

      await Promise.all(
        chunks.map((chunk) =>
          this.provider.deleteObject(`${finalKey}_chunk${chunk.chunkNumber}`),
        ),
      );
    } catch (error) {
      await this.provider.abortMultipartUpload(finalKey, uploadId);
      throw error;
    }
  }

  private getRepositoryForType(
    type: 'audio' | 'image' | 'video',
  ): Repository<FileBase> {
    switch (type) {
      case 'audio':
        return this.audioFileRepository;
      case 'image':
        return this.imageFileRepository;
      case 'video':
        return this.videoFileRepository;
      default:
        throw new Error(`Unsupported file type: ${type}`);
    }
  }

  async deleteFile(fileId: string, user: User): Promise<void> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId, uploadedBy: { id: user.id } },
      });

      if (!file) {
        throw new Error('File not found or access denied');
      }

      // Delete from storage provider
      await this.provider.delete(file.key);

      // Delete metadata file if exists (for local storage)
      if (this.provider instanceof LocalStorageProvider) {
        const metadataPath = `${file.path}.metadata.json`;
        await fs.promises.unlink(metadataPath).catch(() => {});
      }

      // Delete from database
      await this.fileRepository.softRemove(file); // Using softRemove to maintain audit trail
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSignedUrl(
    fileId: string,
    user: User,
    expiresIn: number = 3600,
  ): Promise<ApiResponse<string>> {
    try {
      // 1. Find the file in all possible repositories
      let file: FileBase | null = null;
      const repositories = [
        this.audioFileRepository,
        this.imageFileRepository,
        this.videoFileRepository,
      ];

      for (const repo of repositories) {
        file = await repo.findOne({
          where: { id: fileId },
          relations: ['uploadedBy'],
        });
        if (file) break;
      }

      if (!file) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'File not found',
          data: null,
        };
      }

      // 2. Update access metrics
      file.lastAccessedAt = new Date();
      file.downloadCount += 1;
      await this.getRepositoryForType(this.getFileType(file)).save(file);

      // 3. Generate public URL
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const url = `${baseUrl}/storage/files/${fileId}`;

      return {
        statusCode: HttpStatus.OK,
        message: 'URL generated successfully',
        data: url,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate URL: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to generate URL',
        data: null,
      };
    }
  }

  async getFileMetadata(
    fileId: string,
    user: User | null,
  ): Promise<Record<string, any>> {
    try {
      // Find file by ID in all repositories
      let file: FileBase | null = null;
      const repositories = [
        this.audioFileRepository,
        this.imageFileRepository,
        this.videoFileRepository,
      ];

      for (const repo of repositories) {
        file = await repo.findOne({
          where: { id: fileId },
          relations: ['uploadedBy'],
        });
        if (file) break;
      }

      if (!file) {
        throw new Error('File not found');
      }

      return {
        ...file.metadata,
        filename: file.filename,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        size: file.size,
        status: file.status,
        validationStatus: file.validationStatus,
        isPublic: file.isPublic,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        lastAccessedAt: file.lastAccessedAt,
        downloadCount: file.downloadCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get file metadata: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async updateFileMetadata(
    fileId: string,
    user: User,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId, uploadedBy: { id: user.id } },
      });

      if (!file) {
        throw new Error('File not found or access denied');
      }

      // Update metadata in storage provider
      await this.provider.updateMetadata(file.key, metadata);

      // Update metadata in database
      file.metadata = {
        ...file.metadata,
        ...metadata,
      };

      await this.fileRepository.save(file);
    } catch (error) {
      this.logger.error(
        `Failed to update file metadata: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUploadById(
    id: string,
    type: 'audio' | 'image' | 'video',
  ): Promise<ApiResponse<FileBase>> {
    try {
      this.logger.debug(`Fetching ${type} upload with ID: ${id}`);

      let repository: Repository<FileBase>;

      // Select appropriate repository based on type
      switch (type) {
        case 'audio':
          repository = this.audioFileRepository;
          break;
        case 'image':
          repository = this.imageFileRepository;
          break;
        case 'video':
          repository = this.videoFileRepository;
          break;
        default:
          throw new Error('Invalid file type specified');
      }

      // Find the file
      const file = await repository.findOne({
        where: { id },
      });

      if (!file) {
        this.logger.warn(`${type} upload with ID ${id} not found`);
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: `${type} upload not found`,
          data: null,
        };
      }

      // Update access timestamp
      file.lastAccessedAt = new Date();
      await repository.save(file);

      return {
        statusCode: HttpStatus.OK,
        message: 'Upload details retrieved successfully',
        data: file,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch ${type} upload ${id}: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve upload details',
        data: null,
      };
    }
  }

  async copyFile(
    fileId: string,
    user: User,
    newFilename?: string,
  ): Promise<FileBase> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId },
        relations: ['uploadedBy'],
      });

      if (!file) {
        throw new Error('File not found');
      }

      if (!file.isPublic && (!user || file.uploadedBy?.id !== user.id)) {
        throw new Error('Access denied');
      }

      const destinationKey = `${path.dirname(file.key)}/${newFilename || `copy-${path.basename(file.key)}`}`;
      await this.provider.copy(file.key, destinationKey);

      const repository = this.getRepositoryForType(this.getFileType(file));
      const newFile = repository.create({
        ...file,
        id: undefined, // Let database generate new ID
        filename: newFilename || `copy-${file.filename}`,
        originalFilename: file.originalFilename,
        key: destinationKey,
        uploadedBy: user,
        createdAt: undefined,
        updatedAt: undefined,
        deletedAt: undefined,
        lastAccessedAt: undefined,
        downloadCount: 0,
      });

      return await repository.save(newFile);
    } catch (error) {
      this.logger.error(`Failed to copy file: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getFileType(file: FileBase): 'audio' | 'image' | 'video' {
    // Check the file's metadata to determine its type
    const mimeType = file.mimeType.toLowerCase();

    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';

    // Fallback to checking the file's format
    if (file.metadata?.fileType) {
      return file.metadata.fileType as 'audio' | 'image' | 'video';
    }

    throw new Error('Unknown file type');
  }

  async download(
    key: string,
    options: DownloadOptions = {},
  ): Promise<Buffer | Readable> {
    try {
      return await this.provider.download(key, options);
    } catch (error) {
      this.logger.error(
        `Failed to download file ${key}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async updateAccessMetrics(
    fileId: string,
    userId?: string,
  ): Promise<void> {
    const file = await this.getFileMetadata(fileId, null);
    if (!file) return;

    const repository = this.getRepositoryForType(
      this.getFileType(file as FileBase),
    );
    await repository.update(fileId, {
      lastAccessedAt: new Date(),
      downloadCount: () => 'downloadCount + 1',
      ...(userId && { lastAccessedBy: userId }),
    });
  }

  async getFile(fileId: string, user?: any): Promise<Buffer | Readable> {
    // 1. Find file by ID in database
    let file: FileBase | null = null;
    const repositories = [
      this.audioFileRepository,
      this.imageFileRepository,
      this.videoFileRepository,
    ];

    for (const repo of repositories) {
      file = await repo.findOne({
        where: { id: fileId },
        relations: ['uploadedBy'],
      });
      if (file) break;
    }

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // 2. Update access metrics
    await this.updateAccessMetrics(fileId, user?.id);

    // 3. Return the file content using the file's key
    return this.provider.download(file.key, { asStream: true });
  }
}
