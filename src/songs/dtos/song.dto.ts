// src/songs/dto/create-song.dto.ts
import {
  IsString,
  IsArray,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsISO8601,
  IsUrl,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SongType, SongStatus } from '../entities/song.entity';

class AudioFileDto {
  @IsString()
  originalFile: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MixVersionDto)
  mixVersions?: MixVersionDto[];

  @IsOptional()
  @IsString()
  previewClip?: string;
}

class MixVersionDto {
  @IsString()
  version: string;

  @IsString()
  file: string;
}

class MusicVideoDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsUrl()
  thumbnail?: string;
}

class RoyaltySplitsDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  artistShare: number;

  @ValidateNested({ each: true })
  @Type(() => ContributorShareDto)
  contributorShares: ContributorShareDto[];

  @ValidateNested({ each: true })
  @Type(() => WriterShareDto)
  writerShares: WriterShareDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  labelShare?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  serviceShare: number;
}

class ContributorShareDto {
  @IsString()
  contributorId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  share: number;
}

class WriterShareDto {
  @IsString()
  writerId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  share: number;
}

export class CreateSongDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(SongType)
  songType: SongType;

  @IsArray()
  @IsString({ each: true })
  genres: string[];

  @IsOptional()
  @IsString()
  isrc?: string;

  @IsNumber()
  @Min(1900)
  recordingYear: number;

  @IsString()
  releaseLanguage: string;

  @IsOptional()
  @IsNumber()
  previewClipStartTime?: number;

  @IsOptional()
  @IsNumber()
  previewClipEndTime?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AudioFileDto)
  audioFiles?: AudioFileDto;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MusicVideoDto)
  musicVideo?: MusicVideoDto;

  @ValidateNested()
  @Type(() => RoyaltySplitsDto)
  royaltySplits: RoyaltySplitsDto;

  @IsOptional()
  @IsISO8601()
  proposedReleaseDate?: string;

  @IsOptional()
  @IsString()
  proposedReleaseTime?: string;

  @IsOptional()
  @IsBoolean()
  isPreOrder?: boolean;

  @IsOptional()
  @IsISO8601()
  preOrderDate?: string;

  @IsArray()
  @IsString({ each: true })
  targetStores: string[];

  @IsArray()
  @IsString({ each: true })
  targetCountries: string[];

  @IsEnum(SongStatus)
  status: SongStatus = SongStatus.DRAFT;
}

// src/songs/dto/update-song.dto.ts
import { PartialType } from '@nestjs/mapped-types';
export class UpdateSongDto extends PartialType(CreateSongDto) {}

// src/songs/dto/query-song.dto.ts
export class QuerySongDto {
  @IsOptional()
  @IsEnum(SongStatus)
  status?: SongStatus;

  @IsOptional()
  @IsString()
  artistId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}
