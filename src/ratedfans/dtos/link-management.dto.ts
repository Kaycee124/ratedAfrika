import {
  IsString,
  IsEnum,
  IsUrl,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  Min,
  Max,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StreamingPlatform } from '../entities/ratedfans-link.entity';

// 2024-12-28: Simplified link entry to only require platform and URL
export class CreateLinkDto {
  @IsEnum(StreamingPlatform)
  platform: StreamingPlatform;

  @IsUrl({}, { message: 'Please provide a valid URL' })
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsISO8601()
  releaseDate?: Date; // 2024-12-28: change: added release date for presave functionality

  // 2024-12-28: Removed isPrimary and displayOrder - these will be auto-managed
}

export class UpdateLinkDto {
  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid URL' })
  url?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  displayOrder?: number;
}

export class BulkUpdateLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLinkDto)
  links: CreateLinkDto[];

  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean; // If true, removes existing links not in the array
}

export class LinkSuggestionDto {
  @IsEnum(StreamingPlatform)
  platform: StreamingPlatform;

  @IsString()
  url: string | null;

  @IsBoolean()
  found: boolean;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  confidence?: 'high' | 'medium' | 'low'; // Confidence level of the match
}
