// src/songs/dto/index.ts

import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsUUID,
  IsDecimal,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  IsNotEmpty,
  IsISO8601,
  Matches,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ReleaseContainerType,
  ReleaseContainerStatus,
} from '../entities/album.entity';
import { ReleaseType, SongStatus } from '../entities/song.entity';
// Added from google gemmini
import { Artist } from '../../artists/entities/artist.entity';
import { TempArtist } from '../../artists/entities/temp-artist.entity';
import { ReleaseContainer } from '../entities/album.entity';

// Shared DTOs for common structures
export class MixVersionDto {
  @IsString()
  @IsNotEmpty()
  versionLabel: string;

  @IsUUID()
  fileId: string;
}

export class PreviewClipDto {
  @IsUUID()
  @IsOptional()
  fileId: string;

  @IsNumber()
  @Min(0)
  startTime: number;

  @IsNumber()
  @Min(0)
  endTime: number;
}

export class MusicVideoDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsUUID()
  thumbnailId?: string;
}

// Release Container DTOs
export class CreateReleaseContainerDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ReleaseContainerType)
  type: ReleaseContainerType;

  @IsString()
  @IsNotEmpty()
  releaseLanguage: string;

  @IsString()
  @IsNotEmpty()
  primaryGenre: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryGenres?: string[];

  @IsNumber()
  @Min(1900)
  recordingYear: number;

  @IsOptional()
  @IsString()
  upc?: string;

  @IsOptional()
  @IsString()
  catalogNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  totalTracks: number;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsUUID()
  coverArtId: string;

  @IsOptional()
  @IsISO8601()
  originalReleaseDate?: Date;

  @IsBoolean()
  isExplicit: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TempArtistDto)
  tempFeaturedArtists?: TempArtistDto[];

  @IsUUID()
  @IsNotEmpty()
  primaryArtistId: string;

  @IsISO8601()
  proposedReleaseDate: Date;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  releaseTime: string;

  @IsBoolean()
  isPreOrder: boolean;

  @IsOptional()
  @IsISO8601()
  preOrderDate?: Date;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one target store must be specified' })
  @IsNotEmpty({ each: true, message: 'Each store must not be empty' })
  targetStores: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one target country must be specified' })
  @IsNotEmpty({ each: true, message: 'Each country code must not be empty' })
  targetCountries: string[];
}

export class UpdateReleaseContainerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  coverArtId?: string;

  @IsOptional()
  @IsISO8601()
  proposedReleaseDate?: Date;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  releaseTime?: string;

  @IsOptional()
  @IsBoolean()
  isPreOrder?: boolean;

  @IsOptional()
  @IsISO8601()
  preOrderDate?: Date;

  @IsOptional()
  @IsDecimal({ decimal_digits: '2' })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetStores?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCountries?: string[];

  @IsOptional()
  @IsEnum(ReleaseContainerStatus)
  status?: ReleaseContainerStatus;

  @IsOptional()
  @IsBoolean()
  isExplicit?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TempArtistDto)
  tempFeaturedArtists?: TempArtistDto[];

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}

// Song DTOs
export class CreateSongDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(ReleaseType)
  releaseType: ReleaseType;

  @IsString()
  @IsNotEmpty()
  releaseLanguage: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  primaryGenre: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryGenres?: string[];

  @IsNumber()
  @Min(1900)
  recordingYear: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  coverArtId: string;

  @IsUUID()
  masterTrackId: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MixVersionDto)
  mixVersions?: MixVersionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PreviewClipDto)
  previewClip?: PreviewClipDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MusicVideoDto)
  musicVideo?: MusicVideoDto;

  @IsBoolean()
  isExplicit: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TempArtistDto)
  tempFeaturedArtists?: TempArtistDto[];

  @IsISO8601()
  proposedReleaseDate: Date;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  releaseTime: string;

  @IsBoolean()
  isPreOrder: boolean;

  @IsOptional()
  @IsISO8601()
  preOrderDate?: Date;

  @IsNumber()
  @Min(0)
  trackPrice: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one target country must be specified' })
  @IsNotEmpty({ each: true, message: 'Each country code must not be empty' })
  targetCountries: string[];

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one target store must be specified' })
  @IsNotEmpty({ each: true, message: 'Each store must not be empty' })
  targetStores: string[];

  @IsUUID()
  primaryArtistId: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  featuredArtistIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  collaboratorIds?: string[];

  @IsOptional()
  @IsUUID()
  releaseContainerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  trackNumber?: number;
}

export class UpdateSongDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  coverArtId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MixVersionDto)
  mixVersions?: MixVersionDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PreviewClipDto)
  previewClip?: PreviewClipDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MusicVideoDto)
  musicVideo?: MusicVideoDto;

  @IsOptional()
  @IsISO8601()
  proposedReleaseDate?: Date;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  releaseTime?: string;

  @IsOptional()
  @IsBoolean()
  isPreOrder?: boolean;

  @IsOptional()
  @IsISO8601()
  preOrderDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  trackPrice?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetStores?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetCountries?: string[];

  @IsOptional()
  @IsEnum(SongStatus)
  status?: SongStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  trackNumber?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TempArtistDto)
  tempFeaturedArtists?: TempArtistDto[];
}

export class QuerySongDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsEnum(SongStatus)
  status?: SongStatus;

  @IsOptional()
  @IsEnum(ReleaseType)
  releaseType?: ReleaseType;

  @IsOptional()
  @IsUUID()
  artistId?: string;

  @IsOptional()
  @IsUUID()
  releaseContainerId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class QueryReleaseContainerDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ReleaseContainerType)
  type?: ReleaseContainerType;

  @IsOptional()
  @IsEnum(ReleaseContainerStatus)
  status?: ReleaseContainerStatus;

  @IsOptional()
  @IsUUID()
  artistId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// new DTO for TempArtist
export class TempArtistDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  hasStreamingPresence: boolean;

  @IsOptional()
  @IsUrl()
  spotifyUrl?: string;

  @IsOptional()
  @IsUrl()
  appleMusicUrl?: string;

  @IsOptional()
  @IsUrl()
  youtubeUrl?: string;
}

// DTO for returning song details along with generated file paths
export class SongWithUrlsDto {
  id: string;
  title: string;
  releaseType: ReleaseType;
  releaseLanguage: string;
  label: string;
  primaryGenre: string;
  secondaryGenres: string[];
  recordingYear: number;
  isExplicit: boolean;
  isrc: string | null;
  description: string | null;
  originalReleaseDate: Date | null;
  proposedReleaseDate: Date;
  releaseTime: string;
  isPreOrder: boolean;
  preOrderDate: Date | null;
  trackPrice: number;
  targetStores: string[];
  targetCountries: string[];
  status: SongStatus;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  trackNumber: number | null;

  // Fields with file paths
  coverArtPath: string;
  masterTrackPath: string;
  mixVersions?: { versionLabel: string; fileId: string; path: string }[];
  previewClip?: {
    fileId: string;
    startTime: number;
    endTime: number;
    path: string;
  };
  musicVideo?: {
    url: string;
    thumbnailId?: string;
    path?: string;
  };

  // Related entities
  primaryArtist: Artist;
  featuredPlatformArtists?: Artist[];
  featuredTempArtists?: TempArtist[];
  releaseContainer?: ReleaseContainer;
}

export class DiscographyResponseDto {
  singles: SongWithUrlsDto[];

  albums: {
    id: string;
    title: string;
    type: ReleaseContainerType;
    coverArtPath: string;
    releaseDate: Date;
    status: ReleaseContainerStatus;
    totalTracks: number;
    tracks: SongWithUrlsDto[];
  }[];

  eps: {
    id: string;
    title: string;
    type: ReleaseContainerType;
    coverArtPath: string;
    releaseDate: Date;
    status: ReleaseContainerStatus;
    totalTracks: number;
    tracks: SongWithUrlsDto[];
  }[];
}
// End of Extra added code from Google Gemini
