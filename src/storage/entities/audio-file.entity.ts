// src/infrastructure/storage/entities/audio-file.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { FileBase } from './file-base.entity';

export enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  FLAC = 'flac',
  AAC = 'aac',
  OGG = 'ogg',
}

export enum AudioQuality {
  MASTER = 'master',
  HIGH = 'high', // 320kbps
  STANDARD = 'standard', // 256kbps
  PREVIEW = 'preview', // 128kbps
}

@Entity('audio_files')
export class AudioFile extends FileBase {
  @Column({
    type: 'enum',
    enum: AudioFormat,
  })
  format: AudioFormat;

  @Column({
    type: 'enum',
    enum: AudioQuality,
    default: AudioQuality.MASTER,
  })
  quality: AudioQuality;

  @Column('int')
  duration: number; // Duration in seconds

  @Column('int')
  bitrate: number; // Bitrate in kbps

  @Column('int')
  sampleRate: number; // Sample rate in Hz

  @Column('int')
  channels: number; // Number of audio channels

  @Column('jsonb', { nullable: true })
  waveform: number[]; // Waveform data for visualization

  @Column('float', { nullable: true })
  loudness: number; // Integrated LUFS value

  @Column('jsonb', { nullable: true })
  spectrum: {
    frequencies: number[];
    magnitudes: number[];
  };

  @Column({ nullable: true })
  encoderSettings: string;

  @Column('jsonb', { nullable: true })
  analysis: {
    peakAmplitude: number;
    dynamicRange: number;
    clipCount: number;
    silenceStart?: number[];
    silenceEnd?: number[];
    bpm?: number;
    key?: string;
  };

  @Column({ default: false })
  hasClipping: boolean;

  @Column({ default: false })
  isNormalized: boolean;

  // Relationships
  @OneToMany(() => AudioFile, (audioFile) => audioFile.masterVersion)
  versions: AudioFile[];

  @Column({ nullable: true })
  masterVersionId: string;

  // Self-referential relationship for quality versions
  masterVersion?: AudioFile;
}
