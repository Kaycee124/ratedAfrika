// src/songs/dtos/create-song.dto.ts

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateSongDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  recordLabel?: string;

  @IsOptional()
  @IsString()
  trackMixVersion?: string;

  @IsNotEmpty()
  @IsNumber()
  recordingYear: number;

  @IsNotEmpty()
  @IsString()
  releaseLanguage: string;

  @IsOptional()
  @IsString()
  previewClip?: string;

  @IsBoolean()
  isExplicit: boolean;

  @IsDateString()
  releaseDate: Date;

  @IsNotEmpty()
  @IsString()
  genre: string;

  @IsNotEmpty()
  @IsString()
  ISRC: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  trackArtists: string[];

  @IsArray()
  contributors: string[];

  @IsOptional()
  @IsNumber()
  servicePercentage?: number;

  @IsOptional()
  @IsNumber()
  userSplitPercentage?: number;

  @IsOptional()
  @IsString()
  coverImage?: string;
}
