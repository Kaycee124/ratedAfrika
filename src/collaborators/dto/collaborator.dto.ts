import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
  ValidateNested,
  IsNumber,
  Max,
  IsEnum,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CollaboratorRole } from '../entities/collaborator.entity';

// DTO for creating a song credit
export class CreateCollaboratorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(CollaboratorRole)
  @IsNotEmpty()
  role: CollaboratorRole;

  @IsString()
  @IsOptional()
  creditedAs?: string;

  @IsString()
  @IsOptional()
  spotifyUrl?: string;

  @IsString()
  @IsOptional()
  appleUrl?: string;

  @IsString()
  @IsOptional()
  youtubeUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}

// DTO for updating a song credit
export class UpdateCollaboratorDto extends PartialType(CreateCollaboratorDto) {
  @IsUUID()
  @IsOptional()
  songId?: string; // Usually won't change, but make it optional for updates
}

// Split Sheet DTOs
export class CreateSplitSheetEntryDto {
  @IsNotEmpty()
  @IsEmail()
  recipientEmail: string;

  @IsNotEmpty()
  @IsString()
  recipientName?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}

export class CreateSplitSheetDto {
  @IsNotEmpty()
  @IsUUID()
  songId: string;

  @ValidateNested({ each: true })
  @Type(() => CreateSplitSheetEntryDto)
  entries: CreateSplitSheetEntryDto[]; // Fixed: Changed to array
}

export class ClaimSplitEntryDto {
  @IsNotEmpty()
  @IsString()
  claimToken: string; // Replace encryptedEntryId with claimToken
}

export class UpdateSplitSheetEntryDto extends CreateSplitSheetEntryDto {
  @IsOptional()
  @IsUUID()
  id?: string;
}

export class UpdateSplitSheetDto {
  @ValidateNested({ each: true })
  @Type(() => UpdateSplitSheetEntryDto)
  @IsNotEmpty()
  entries: UpdateSplitSheetEntryDto[]; // Fixed: Changed to array and made required
}
