import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsISO8601,
  IsUrl,
  IsNotEmpty,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReleaseType } from '../entities/ratedfans-page.entity';

// 2024-12-28: Added DTO for preview clips with titles
export class PreviewClipDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUrl({}, { message: 'Please provide a valid audio URL' })
  @IsNotEmpty()
  url: string;
}

// 2024-12-28: Added DTO for cover art link
export class CoverArtLinkDto {
  @IsUrl({}, { message: 'Please provide a valid image URL' })
  @IsNotEmpty()
  url: string;
}

export class CreatePageDto {
  @IsString()
  @IsNotEmpty()
  releaseTitle: string; // 2024-09-22: change: renamed from title

  @IsString()
  @IsNotEmpty()
  artistName: string; // 2024-12-28: change: added artist name field

  @IsOptional()
  @IsUUID()
  songId?: string; // 2024-12-28: change: made optional for platform songs

  @IsOptional()
  @IsString()
  customSlug?: string; // Allow custom slug, will fallback to auto-generated

  @IsOptional()
  @IsBoolean()
  isPresaveEnabled?: boolean;

  @IsOptional()
  @IsISO8601()
  releaseDate?: Date;

  @IsOptional()
  @IsEnum(ReleaseType) //
  releaseType?: ReleaseType; // 2024-09-22: change: it was failing with string

  @IsOptional()
  @IsObject()
  socialMediaLinks?: {
    instagram?: string;
    tiktok?: string;
    x?: string;
    facebook?: string;
    youtube?: string;
    mail?: string;
  }; // 2024-09-22: change: page-specific social media links

  @IsOptional()
  @IsObject()
  artistSocialMediaLinks?: {
    instagram?: string;
    tiktok?: string;
    x?: string;
    facebook?: string;
    youtube?: string;
    mail?: string;
  }; // 2024-12-28: change: artist social media links from request

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviewClipDto)
  previewClips?: PreviewClipDto[]; // 2024-12-28: change: support multiple preview clips with titles

  @IsOptional()
  @ValidateNested()
  @Type(() => CoverArtLinkDto)
  coverArtLink?: CoverArtLinkDto; // 2024-12-28: change: optional cover art link
}

// 2024-12-28: Added DTO for updating RatedFans pages
export class UpdatePageDto {
  @IsOptional()
  @IsString()
  releaseTitle?: string;

  @IsOptional()
  @IsString()
  artistName?: string;

  @IsOptional()
  @IsString()
  customSlug?: string;

  @IsOptional()
  @IsBoolean()
  isPresaveEnabled?: boolean;

  @IsOptional()
  @IsISO8601()
  releaseDate?: Date;

  @IsOptional()
  @IsEnum(ReleaseType)
  releaseType?: ReleaseType;

  @IsOptional()
  @IsObject()
  socialMediaLinks?: {
    instagram?: string;
    tiktok?: string;
    x?: string;
    facebook?: string;
    youtube?: string;
    mail?: string;
  };

  @IsOptional()
  @IsObject()
  artistSocialMediaLinks?: {
    instagram?: string;
    tiktok?: string;
    x?: string;
    facebook?: string;
    youtube?: string;
    mail?: string;
  }; // 2024-12-28: change: artist social media links from request

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviewClipDto)
  previewClips?: PreviewClipDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CoverArtLinkDto)
  coverArtLink?: CoverArtLinkDto;
}
