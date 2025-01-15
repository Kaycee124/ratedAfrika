/* eslint-disable @typescript-eslint/no-unused-vars */
// src/infrastructure/storage/services/storage.service.ts
import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
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
    try {
      let fileEntity: FileBase;
      const repository = this.getRepositoryForType(options.type);

      // Upload to storage provider
      const { key, url } = await this.provider.upload(
        file.originalname,
        file.buffer,
        {
          contentType: file.mimetype,
          isPublic: options.isPublic,
          metadata: options.metadata,
        },
      );

      const baseProps = {
        filename: file.originalname,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: url,
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

      // Save the initial entity
      const savedEntity = await repository.save(fileEntity);

      // Trigger async validation based on file type
      // switch (options.type) {
      //   case 'audio':
      //     void this.fileValidationService.validateAudioFile(
      //       savedEntity as AudioFile,
      //     );
      //     break;
      //   case 'image':
      //     void this.fileValidationService.validateImageFile(
      //       savedEntity as ImageFile,
      //     );
      //     break;
      //   case 'video':
      //     void this.fileValidationService.validateVideoFile(
      //       savedEntity as VideoFile,
      //     );
      //     break;
      // }

      return savedEntity;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
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
  ): Promise<string> {
    try {
      const file = await this.fileRepository.findOne({
        where: { id: fileId },
      });

      if (!file) {
        throw new Error('File not found');
      }

      // Check if file is public or owned by the requesting user
      if (!file.isPublic && (!user || file.uploadedBy?.id !== user.id)) {
        throw new Error('Access denied');
      }

      // Update last accessed timestamp
      file.lastAccessedAt = new Date();
      file.downloadCount += 1;
      await this.fileRepository.save(file);

      return this.provider.getSignedUrl(file.key, expiresIn);
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getFileMetadata(
    fileId: string,
    user: User,
  ): Promise<Record<string, any>> {
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
    if (file instanceof AudioFile) return 'audio';
    if (file instanceof ImageFile) return 'image';
    if (file instanceof VideoFile) return 'video';
    throw new Error('Unknown file type');
  }
}
