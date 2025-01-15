// src/infrastructure/storage/entities/image-file.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { FileBase } from './file-base.entity';

export enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp',
  GIF = 'gif',
  SVG = 'svg',
}

export enum ImageSize {
  ORIGINAL = 'original',
  LARGE = 'large', // e.g., 1920x1080
  MEDIUM = 'medium', // e.g., 1280x720
  SMALL = 'small', // e.g., 640x360
  THUMBNAIL = 'thumbnail', // e.g., 150x150
}

@Entity('image_files')
export class ImageFile extends FileBase {
  @Column({
    type: 'enum',
    enum: ImageFormat,
  })
  format: ImageFormat;

  @Column({
    type: 'enum',
    enum: ImageSize,
    default: ImageSize.ORIGINAL,
  })
  sizeType: ImageSize;

  @Column('int')
  width: number;

  @Column('int')
  height: number;

  @Column('int', { nullable: true })
  dpi: number;

  @Column({ nullable: true })
  colorSpace: string;

  @Column('int', { nullable: true })
  bitDepth: number;

  @Column({ default: false })
  hasAlpha: boolean;

  @Column('jsonb', { nullable: true })
  colorProfile: {
    name: string;
    description: string;
    metadata?: Record<string, any>;
  };

  @Column('jsonb', { nullable: true })
  compression: {
    type: string;
    quality: number;
    ratio: number;
  };

  @Column('jsonb', { nullable: true })
  analysis: {
    dominantColors: string[];
    averageColor: string;
    brightness: number;
    contrast: number;
    sharpness: number;
  };

  // Relationships
  @OneToMany(() => ImageFile, (imageFile) => imageFile.originalVersion)
  versions: ImageFile[];

  @Column({ nullable: true })
  originalVersionId: string;

  // Self-referential relationship for different sizes
  originalVersion?: ImageFile;
}
