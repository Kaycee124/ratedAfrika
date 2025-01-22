import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CollaboratorRole } from '../entities/collaborator.entity';

// Base Collaborator DTO
export class BaseCollaboratorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsBoolean()
  hasPublishedMusic: boolean;
}

// Create Collaborator DTO
export class CreateCollaboratorDto extends BaseCollaboratorDto {}

// Update Collaborator DTO
export class UpdateCollaboratorDto extends PartialType(BaseCollaboratorDto) {}

// Song Collaborator DTOs
export class BaseSongCollaboratorDto {
  @IsUUID()
  @IsNotEmpty()
  songId: string;

  @IsUUID()
  @IsNotEmpty()
  collaboratorId: string;

  @IsEnum(CollaboratorRole)
  @IsNotEmpty()
  role: CollaboratorRole;

  @IsNumber()
  @Min(0)
  @Max(100)
  splitPercentage: number;
}

// Create Song Collaborator DTO
export class CreateSongCollaboratorDto extends BaseSongCollaboratorDto {}

// Update Song Collaborator DTO
export class UpdateSongCollaboratorDto extends PartialType(
  BaseSongCollaboratorDto,
) {}

// Response DTOs for Swagger Documentation
export class CollaboratorResponseDto extends BaseCollaboratorDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SongCollaboratorResponseDto extends BaseSongCollaboratorDto {
  id: string;
  collaborator: CollaboratorResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
