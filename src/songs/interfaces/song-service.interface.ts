// src/songs/interfaces/song-service.interface.ts
import { Song, SongStatus } from '../entities/song.entity';
import { CreateSongDto, UpdateSongDto, QuerySongDto } from '../dtos/song.dto';

export interface AudioProcessingResult {
  success: boolean;
  duration?: number;
  bitrate?: number;
  format?: string;
  waveform?: number[];
  error?: string;
}

export interface ImageProcessingResult {
  success: boolean;
  width?: number;
  height?: number;
  format?: string;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
  };
  error?: string;
}

export interface VideoProcessingResult {
  success: boolean;
  duration?: number;
  format?: string;
  thumbnail?: string;
  previewClip?: string;
  error?: string;
}

export interface ProcessingStatus {
  audio?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: AudioProcessingResult;
  };
  image?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: ImageProcessingResult;
  };
  video?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: VideoProcessingResult;
  };
}

export interface SongValidationResult {
  isValid: boolean;
  errors?: {
    field: string;
    message: string;
  }[];
}

export interface PaginatedSongs {
  items: Song[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ISongService {
  // Core CRUD operations
  createSong(userId: string, createSongDto: CreateSongDto): Promise<Song>;
  updateSong(
    userId: string,
    songId: string,
    updateSongDto: UpdateSongDto,
  ): Promise<Song>;
  deleteSong(userId: string, songId: string): Promise<void>;
  getSong(songId: string): Promise<Song>;
  querySongs(queryDto: QuerySongDto): Promise<PaginatedSongs>;

  // File management
  uploadAudio(
    songId: string,
    file: Express.Multer.File,
    version?: string,
  ): Promise<AudioProcessingResult>;
  uploadArtwork(
    songId: string,
    file: Express.Multer.File,
  ): Promise<ImageProcessingResult>;
  uploadVideo(
    songId: string,
    file: Express.Multer.File,
  ): Promise<VideoProcessingResult>;

  // Status management
  updateStatus(
    songId: string,
    newStatus: SongStatus,
    notes?: string,
  ): Promise<Song>;
  getProcessingStatus(songId: string): Promise<ProcessingStatus>;

  // Validation
  validateSong(songId: string): Promise<SongValidationResult>;
  validateRoyaltySplits(songId: string): Promise<SongValidationResult>;

  // Release management
  scheduleRelease(songId: string, releaseDate: Date): Promise<Song>;
  submitForReview(songId: string): Promise<Song>;

  // Queries
  getUserDrafts(userId: string): Promise<Song[]>;
  getPendingReviews(): Promise<Song[]>;
  getScheduledReleases(): Promise<Song[]>;
}

// src/songs/interfaces/file-processor.interface.ts
export interface IFileProcessor {
  processAudio(file: Express.Multer.File): Promise<AudioProcessingResult>;
  processImage(file: Express.Multer.File): Promise<ImageProcessingResult>;
  processVideo(file: Express.Multer.File): Promise<VideoProcessingResult>;
  generateWaveform(audioFile: string): Promise<number[]>;
  generatePreviewClip(
    audioFile: string,
    startTime: number,
    duration: number,
  ): Promise<string>;
  generateThumbnails(
    imageFile: string,
  ): Promise<ImageProcessingResult['thumbnails']>;
}

// src/songs/interfaces/metadata-service.interface.ts
export interface IMetadataService {
  validateISRC(isrc: string): Promise<boolean>;
  enrichMetadata(songId: string): Promise<void>;
  validateMetadata(songId: string): Promise<SongValidationResult>;
}

// src/songs/interfaces/distribution-service.interface.ts
export interface IDistributionService {
  prepareForDistribution(songId: string): Promise<void>;
  submitToStores(songId: string, stores: string[]): Promise<void>;
  checkDistributionStatus(songId: string): Promise<Record<string, string>>;
  withdrawFromStores(songId: string, stores?: string[]): Promise<void>;
}
