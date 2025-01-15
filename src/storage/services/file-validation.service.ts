/* eslint-disable @typescript-eslint/no-unused-vars */
// src/infrastructure/storage/services/file-validation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { FileValidationStatus } from '../entities/file-base.entity';
import { AudioFile } from '../entities/audio-file.entity';
import { ImageFile } from '../entities/image-file.entity';
import { VideoFile } from '../entities/video-file.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as ffmpeg from 'fluent-ffmpeg';
import * as mm from 'music-metadata';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import * as sharp from 'sharp';

@Injectable()
export class FileValidationService {
  private readonly logger = new Logger(FileValidationService.name);

  constructor(
    @InjectRepository(AudioFile)
    private readonly audioFileRepository: Repository<AudioFile>,
    @InjectRepository(ImageFile)
    private readonly imageFileRepository: Repository<ImageFile>,
    @InjectRepository(VideoFile)
    private readonly videoFileRepository: Repository<VideoFile>,
  ) {}

  //   async validateAudioFile(file: AudioFile): Promise<void> {
  //     try {
  //       file.validationStatus = FileValidationStatus.IN_PROGRESS;
  //       await this.audioFileRepository.save(file);

  //       // TODO: Implement actual audio validation
  //       // - Check file format
  //       // - Validate bit rate
  //       // - Check sample rate
  //       // - Analyze audio quality
  //       // - Check for corruption
  //       // - etc.

  //       const validationResults = {
  //         format: true,
  //         bitrate: true,
  //         sampleRate: true,
  //         channels: true,
  //         duration: true,
  //         corruption: false,
  //       };

  //       file.validationStatus = Object.values(validationResults).every(
  //         (result) => result,
  //       )
  //         ? FileValidationStatus.PASSED
  //         : FileValidationStatus.FAILED;

  //       file.validationResults = validationResults;
  //       await this.audioFileRepository.save(file);
  //     } catch (error) {
  //       this.logger.error(
  //         `Failed to validate audio file: ${error.message}`,
  //         error.stack,
  //       );
  //       file.validationStatus = FileValidationStatus.FAILED;
  //       file.validationResults = { error: error.message };
  //       await this.audioFileRepository.save(file);
  //       throw error;
  //     }
  //   }

  // Validate audiofile implementation
  // Validate audio file comprehensively
  private async validateAudioFile(file: AudioFile): Promise<void> {
    try {
      file.validationStatus = FileValidationStatus.IN_PROGRESS;
      await this.audioFileRepository.save(file);

      // Parse metadata using music-metadata
      const metadata = await mm.parseFile(file.path);

      // Basic format validation
      const formatValidation = await this.validateAudioFormat(metadata);

      // Quality checks
      const qualityValidation = await this.validateAudioQuality(
        file.path,
        metadata,
      );

      // Integrity check
      const integrityValidation = await this.checkAudioIntegrity(file.path);

      const validationResults = {
        format: formatValidation,
        quality: qualityValidation,
        integrity: integrityValidation,
        metadata: {
          duration: metadata.format.duration,
          bitrate: metadata.format.bitrate,
          sampleRate: metadata.format.sampleRate,
          channels: metadata.format.numberOfChannels,
        },
      };

      // Update file entity with audio metadata
      file.duration = Math.round(metadata.format.duration);
      file.bitrate = metadata.format.bitrate;
      file.sampleRate = metadata.format.sampleRate;
      file.channels = metadata.format.numberOfChannels;

      file.validationStatus = Object.values(validationResults).every(
        (result) => result,
      )
        ? FileValidationStatus.PASSED
        : FileValidationStatus.FAILED;

      file.validationResults = validationResults;
      await this.audioFileRepository.save(file);
    } catch (error) {
      this.logger.error(
        `Audio validation failed: ${error.message}`,
        error.stack,
      );
      file.validationStatus = FileValidationStatus.FAILED;
      file.validationResults = { error: error.message };
      await this.audioFileRepository.save(file);
      throw error;
    }
  }

  // Validate audio format and basic properties
  private async validateAudioFormat(
    metadata: mm.IAudioMetadata,
  ): Promise<boolean> {
    // Accepted formats for music distribution
    const validFormats = ['mp3', 'wav', 'flac', 'aac', 'm4a'];
    const format = metadata.format.container.toLowerCase();

    // Basic format requirements for distribution
    const requirements = {
      format: validFormats.includes(format),
      sampleRate: metadata.format.sampleRate >= 44100, // Minimum 44.1kHz
      bitrate: metadata.format.bitrate >= 320000, // Minimum 320kbps
      channels: metadata.format.numberOfChannels >= 2, // Minimum stereo
    };

    return Object.values(requirements).every(Boolean);
  }

  // Validate- audio- quality using FFmpeg
  private async validateAudioQuality(
    filePath: string,
    metadata: mm.IAudioMetadata,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      let peakLevel = -100;
      const clippingCount = 0;

      ffmpeg(filePath)
        .audioFilters('volumedetect')
        .on('error', (err) => {
          this.logger.error('FFmpeg error:', err);
          resolve(false);
        })
        .on('end', (stdout, stderr) => {
          // Parse FFmpeg output for audio levels
          const maxVolumeMatch = stderr.match(/max_volume: ([-\d.]+)/);
          const meanVolumeMatch = stderr.match(/mean_volume: ([-\d.]+)/);

          if (maxVolumeMatch) {
            peakLevel = parseFloat(maxVolumeMatch[1]);
          }

          // Check for potential clipping (peaks too close to 0 dB)
          const hasClipping = peakLevel > -0.1; // -0.1 dB threshold

          // Validate based on industry standards
          const qualityChecks = {
            peakLevel: peakLevel < 0, // Ensure some headroom
            clipping: !hasClipping,
            meanLevel: meanVolumeMatch
              ? parseFloat(meanVolumeMatch[1]) > -30
              : false,
            dynamicRange: true, // Placeholder for dynamic range check
          };

          resolve(Object.values(qualityChecks).every(Boolean));
        })
        .run();
    });
  }

  // Check audio file integrity
  private async checkAudioIntegrity(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
      ffmpeg(filePath)
        .on('error', (err) => {
          this.logger.error('Integrity check failed:', err);
          resolve(false);
        })
        .on('end', () => {
          resolve(true);
        })
        .run();
    });
  }

  // end of implementation

  //   implement validate image file validation
  // Validate image file comprehensively
  private async validateImageFile(file: ImageFile): Promise<void> {
    try {
      file.validationStatus = FileValidationStatus.IN_PROGRESS;
      await this.imageFileRepository.save(file);

      // Load image with sharp
      const image = sharp(file.path);
      const metadata = await image.metadata();

      // Format validation
      const formatValidation = await this.validateImageFormat(metadata);

      // Quality validation
      const qualityValidation = await this.validateImageQuality(
        image,
        metadata,
      );

      // Dimension validation
      const dimensionValidation = await this.validateImageDimensions(metadata);

      const validationResults = {
        format: formatValidation,
        quality: qualityValidation,
        dimensions: dimensionValidation,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          colorSpace: metadata.space,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha,
        },
      };

      // Update image entity with metadata
      file.width = metadata.width;
      file.height = metadata.height;
      file.colorSpace = metadata.space;
      file.hasAlpha = metadata.hasAlpha;

      file.validationStatus = Object.values(validationResults).every(
        (result) => result,
      )
        ? FileValidationStatus.PASSED
        : FileValidationStatus.FAILED;

      file.validationResults = validationResults;
      await this.imageFileRepository.save(file);
    } catch (error) {
      this.logger.error(
        `Image validation failed: ${error.message}`,
        error.stack,
      );
      file.validationStatus = FileValidationStatus.FAILED;
      file.validationResults = { error: error.message };
      await this.imageFileRepository.save(file);
      throw error;
    }
  }

  // Validate image format and properties
  private async validateImageFormat(
    metadata: sharp.Metadata,
  ): Promise<boolean> {
    // Accepted formats for artwork/images
    const validFormats = ['jpeg', 'png', 'webp'];
    const format = metadata.format?.toLowerCase();

    const requirements = {
      format: validFormats.includes(format),
      colorSpace: ['srgb', 'rgb'].includes(metadata.space?.toLowerCase()),
      channels: metadata.channels >= 3, // RGB or RGBA
    };

    return Object.values(requirements).every(Boolean);
  }

  // Validate image quality
  private async validateImageQuality(
    image: sharp.Sharp,
    metadata: sharp.Metadata,
  ): Promise<boolean> {
    const stats = await image.stats();

    // Calculate perceived brightness
    const brightness =
      stats.channels[0].mean * 0.299 +
      stats.channels[1].mean * 0.587 +
      stats.channels[2].mean * 0.114;

    // Calculate contrast (using standard deviation as an approximation)
    const contrast =
      (stats.channels[0].stdev +
        stats.channels[1].stdev +
        stats.channels[2].stdev) /
      3;

    const qualityChecks = {
      brightness: brightness >= 20 && brightness <= 235, // Avoid too dark/bright
      contrast: contrast >= 10, // Ensure minimum contrast
      sharpness: true, // Placeholder for sharpness check
    };

    return Object.values(qualityChecks).every(Boolean);
  }

  // Validate image dimensions
  private async validateImageDimensions(
    metadata: sharp.Metadata,
  ): Promise<boolean> {
    const minWidth = 1400;
    const minHeight = 1400;
    const maxWidth = 4000;
    const maxHeight = 4000;
    const aspectRatio = metadata.width / metadata.height;

    const requirements = {
      width: metadata.width >= minWidth && metadata.width <= maxWidth,
      height: metadata.height >= minHeight && metadata.height <= maxHeight,
      aspectRatio: aspectRatio >= 0.9 && aspectRatio <= 1.1, // Square-ish artwork
      resolution: metadata.width * metadata.height >= minWidth * minHeight,
    };

    return Object.values(requirements).every(Boolean);
  }

  // Endofimplementation

  //   async validateImageFile(file: ImageFile): Promise<void> {
  //     try {
  //       file.validationStatus = FileValidationStatus.IN_PROGRESS;
  //       await this.imageFileRepository.save(file);

  //       // TODO: Implement actual image validation
  //       // - Check dimensions
  //       // - Validate format
  //       // - Check color space
  //       // - Verify file integrity
  //       // - etc.

  //       const validationResults = {
  //         format: true,
  //         dimensions: true,
  //         colorSpace: true,
  //         compression: true,
  //         corruption: false,
  //       };

  //       file.validationStatus = Object.values(validationResults).every(
  //         (result) => result,
  //       )
  //         ? FileValidationStatus.PASSED
  //         : FileValidationStatus.FAILED;

  //       file.validationResults = validationResults;
  //       await this.imageFileRepository.save(file);
  //     } catch (error) {
  //       this.logger.error(
  //         `Failed to validate image file: ${error.message}`,
  //         error.stack,
  //       );
  //       file.validationStatus = FileValidationStatus.FAILED;
  //       file.validationResults = { error: error.message };
  //       await this.imageFileRepository.save(file);
  //       throw error;
  //     }
  //   }

  //  Validate video file

  // Validate video file comprehensively
  private async validateVideoFile(file: VideoFile): Promise<void> {
    try {
      file.validationStatus = FileValidationStatus.IN_PROGRESS;
      await this.videoFileRepository.save(file);

      // Get metadata using FFprobe
      const metadata = await this.getVideoMetadata(file.path);

      // Basic format validation
      const formatValidation = await this.validateVideoFormat(metadata);

      // Quality checks
      const qualityValidation = await this.validateVideoQuality(
        file.path,
        metadata,
      );

      // Stream validation
      const streamValidation = await this.validateVideoStreams(metadata);

      const validationResults = {
        format: formatValidation,
        quality: qualityValidation,
        streams: streamValidation,
        metadata: {
          duration: metadata.format.duration,
          bitrate: metadata.format.bit_rate,
          size: metadata.format.size,
          videoCodec: metadata.streams[0].codec_name,
          width: metadata.streams[0].width,
          height: metadata.streams[0].height,
          frameRate: eval(metadata.streams[0].r_frame_rate),
        },
      };

      // Update video entity with metadata
      file.duration = Math.round(metadata.format.duration);
      file.width = metadata.streams[0].width;
      file.height = metadata.streams[0].height;
      file.frameRate = eval(metadata.streams[0].r_frame_rate);
      file.bitrate = parseInt(metadata.format.bit_rate);

      file.videoStream = {
        codec: metadata.streams[0].codec_name,
        bitrate: parseInt(metadata.streams[0].bit_rate || '0'),
        frameRate: eval(metadata.streams[0].r_frame_rate),
      };

      if (metadata.streams[1] && metadata.streams[1].codec_type === 'audio') {
        file.audioStream = {
          codec: metadata.streams[1].codec_name,
          bitrate: parseInt(metadata.streams[1].bit_rate || '0'),
          sampleRate: parseInt(metadata.streams[1].sample_rate),
          channels: metadata.streams[1].channels,
        };
      }

      file.validationStatus = Object.values(validationResults).every(
        (result) => result,
      )
        ? FileValidationStatus.PASSED
        : FileValidationStatus.FAILED;

      file.validationResults = validationResults;
      await this.videoFileRepository.save(file);
    } catch (error) {
      this.logger.error(
        `Video validation failed: ${error.message}`,
        error.stack,
      );
      file.validationStatus = FileValidationStatus.FAILED;
      file.validationResults = { error: error.message };
      await this.videoFileRepository.save(file);
      throw error;
    }
  }

  // Get video metadata using FFprobe
  private async getVideoMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
  }

  // Validate video format and basic properties
  private async validateVideoFormat(metadata: any): Promise<boolean> {
    const validCodecs = ['h264', 'hevc', 'vp9'];
    const videoStream = metadata.streams.find((s) => s.codec_type === 'video');

    const requirements = {
      codec: validCodecs.includes(videoStream.codec_name.toLowerCase()),
      resolution: videoStream.width >= 1280 && videoStream.height >= 720, // Minimum 720p
      frameRate: eval(videoStream.r_frame_rate) >= 24, // Minimum 24fps
      bitrate: parseInt(metadata.format.bit_rate) >= 2000000, // Minimum 2Mbps
    };

    return Object.values(requirements).every(Boolean);
  }

  // Validate video quality
  private async validateVideoQuality(
    filePath: string,
    metadata: any,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      let hasIssues = false;

      ffmpeg(filePath)
        .videoFilters('blackframe=d=1:pix_th=0.1') // Detect black frames
        .on('error', (err) => {
          this.logger.error('Quality check failed:', err);
          resolve(false);
        })
        .on('stderr', (stderrLine) => {
          // Check for quality issues in FFmpeg output
          if (stderrLine.includes('black_frame')) hasIssues = true;
        })
        .on('end', () => {
          resolve(!hasIssues);
        })
        .run();
    });
  }

  // Validate video streams
  private async validateVideoStreams(metadata: any): Promise<boolean> {
    const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
    const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

    const requirements = {
      hasVideo: !!videoStream,
      hasAudio: !!audioStream,
      videoCodec: videoStream?.codec_name?.toLowerCase() !== 'mpeg4', // No old MPEG4
      audioCodec: audioStream?.codec_name?.toLowerCase() !== 'mp3', // Prefer AAC
      videoProfile: this.checkVideoProfile(videoStream),
      audioBitrate: audioStream
        ? parseInt(audioStream.bit_rate || '0') >= 192000
        : false, // Min 192kbps audio
    };

    return Object.values(requirements).every(Boolean);
  }

  // Helper function to check video profile
  private checkVideoProfile(videoStream: any): boolean {
    if (!videoStream.profile) return false;

    const profile = videoStream.profile.toLowerCase();
    // Check for high quality profiles
    if (videoStream.codec_name === 'h264') {
      return ['high', 'main'].includes(profile);
    } else if (videoStream.codec_name === 'hevc') {
      return ['main', 'main 10'].includes(profile);
    }
    return true; // For other codecs
  }

  // Add these helper functions for extended validation
  private async analyzeVideoQuality(file: VideoFile): Promise<void> {
    try {
      // Initialize analysis object
      const analysis = {
        averageBitrate: 0,
        maxBitrate: 0,
        qualityMetrics: {
          psnr: 0,
          vmaf: 0,
        },
        sceneChanges: [],
        blackFrames: [],
        audioLevels: {
          peak: -100,
          average: -100,
        },
      };

      // Analyze bitrate variations
      await this.analyzeBitrate(file.path, analysis);

      // Detect scene changes
      await this.detectSceneChanges(file.path, analysis);

      // Check audio levels
      await this.analyzeAudioLevels(file.path, analysis);

      // Update file entity with analysis results
      file.analysis = analysis;
      await this.videoFileRepository.save(file);
    } catch (error) {
      this.logger.error(`Video analysis failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async analyzeBitrate(filePath: string, analysis: any): Promise<void> {
    return new Promise((resolve, reject) => {
      let totalBitrate = 0;
      let samples = 0;
      let maxBitrate = 0;

      ffmpeg(filePath)
        .outputOptions(['-bitrate_measurement 100ms'])
        .on('stderr', (stderrLine) => {
          const bitrateMatch = stderrLine.match(/bitrate=\s*(\d+)/);
          if (bitrateMatch) {
            const bitrate = parseInt(bitrateMatch[1]);
            totalBitrate += bitrate;
            samples++;
            maxBitrate = Math.max(maxBitrate, bitrate);
          }
        })
        .on('end', () => {
          analysis.averageBitrate = totalBitrate / samples;
          analysis.maxBitrate = maxBitrate;
          resolve();
        })
        .on('error', reject)
        .run();
    });
  }

  // private async detectSceneChanges(
  //   filePath: string,
  //   analysis: any,
  // ): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     ffmpeg(filePath)
  //       .outputOptions(['-vf "select=gt(scene,0.4)"', '-f null'])
  //       .on('stderr', (stderrLine) => {
  //         const sceneMatch = stderrLine.match(/pts_time:([\d.]+)/);
  //         if (sceneMatch) {
  //           analysis.sceneChanges.push(parseFloat(sceneMatch[1]));
  //         }
  //       })
  //       .on('end', resolve)
  //       .on('error', reject)
  //       .run();
  //   });
  // }
  private async detectSceneChanges(
    filePath: string,
    analysis: any,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions(['-vf "select=gt(scene,0.4)"', '-f null'])
        .on('stderr', (stderrLine: string) => {
          const sceneMatch = stderrLine.match(/pts_time:([\d.]+)/);
          if (sceneMatch) {
            analysis.sceneChanges.push(parseFloat(sceneMatch[1]));
          }
        })
        .on('end', () => resolve()) // Explicitly call resolve with no arguments
        .on('error', (err) => reject(err))
        .run();
    });
  }

  // private async analyzeAudioLevels(
  //   filePath: string,
  //   analysis: any,
  // ): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     ffmpeg(filePath)
  //       .audioFilters('volumedetect')
  //       .on('stderr', (stderrLine) => {
  //         const maxVolumeMatch = stderrLine.match(/max_volume:\s*([-\d.]+)/);
  //         const meanVolumeMatch = stderrLine.match(/mean_volume:\s*([-\d.]+)/);

  //         if (maxVolumeMatch) {
  //           analysis.audioLevels.peak = parseFloat(maxVolumeMatch[1]);
  //         }
  //         if (meanVolumeMatch) {
  //           analysis.audioLevels.average = parseFloat(meanVolumeMatch[1]);
  //         }
  //       })
  //       .on('end', resolve)
  //       .on('error', reject)
  //       .run();
  //   });
  private async analyzeAudioLevels(
    filePath: string,
    analysis: any,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(filePath)
        .audioFilters('volumedetect')
        .on('stderr', (stderrLine: string) => {
          const maxVolumeMatch = stderrLine.match(/max_volume:\s*([-\d.]+)/);
          const meanVolumeMatch = stderrLine.match(/mean_volume:\s*([-\d.]+)/);

          if (maxVolumeMatch) {
            analysis.audioLevels.peak = parseFloat(maxVolumeMatch[1]);
          }

          if (meanVolumeMatch) {
            analysis.audioLevels.average = parseFloat(meanVolumeMatch[1]);
          }
        })
        .on('end', () => resolve()) // Explicitly call resolve with no arguments
        .on('error', (err) => reject(err))
        .run();
    });

    // end of implementation
  }
}
