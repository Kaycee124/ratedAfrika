// src/infrastructure/storage/entities/video-file.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { FileBase } from './file-base.entity';

export enum VideoFormat {
  MP4 = 'mp4',
  MOV = 'mov',
  AVI = 'avi',
  MKV = 'mkv',
  WEBM = 'webm',
}

export enum VideoQuality {
  MASTER = 'master',
  HD = 'hd', // 1080p
  SD = 'sd', // 720p
  LOW = 'low', // 480p
  PREVIEW = 'preview', // 360p
}

@Entity('video_files')
export class VideoFile extends FileBase {
  @Column({
    type: 'enum',
    enum: VideoFormat,
  })
  format: VideoFormat;

  @Column({
    type: 'enum',
    enum: VideoQuality,
    default: VideoQuality.MASTER,
  })
  quality: VideoQuality;

  @Column('int')
  duration: number; // Duration in seconds

  @Column('int')
  width: number;

  @Column('int')
  height: number;

  @Column('float')
  frameRate: number;

  @Column('int')
  bitrate: number; // Total bitrate in kbps

  @Column('jsonb')
  videoStream: {
    codec: string;
    bitrate: number;
    profile?: string;
    frameRate: number;
    keyframeInterval?: number;
  };

  @Column('jsonb', { nullable: true })
  audioStream: {
    codec: string;
    bitrate: number;
    sampleRate: number;
    channels: number;
  };

  @Column('jsonb', { nullable: true })
  encodingSettings: {
    preset: string;
    crf?: number;
    pixelFormat?: string;
    colorSpace?: string;
    profile?: string;
  };

  @Column('jsonb', { nullable: true })
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
    copyright?: string;
    creationDate?: Date;
  };

  @Column('jsonb', { nullable: true })
  analysis: {
    averageBitrate: number;
    maxBitrate: number;
    qualityMetrics: {
      psnr?: number;
      ssim?: number;
      vmaf?: number;
    };
    sceneChanges?: number[];
    blackFrames?: number[];
    audioLevels?: {
      peak: number;
      average: number;
    };
  };

  @Column({ nullable: true })
  thumbnailKey: string;

  // Relationships
  @OneToMany(() => VideoFile, (videoFile) => videoFile.masterVersion)
  versions: VideoFile[];

  @Column({ nullable: true })
  masterVersionId: string;

  // Self-referential relationship for quality versions
  masterVersion?: VideoFile;
}
