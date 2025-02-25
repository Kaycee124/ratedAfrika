// import {
//   IsEmail,
//   IsEnum,
//   IsNotEmpty,
//   IsString,
//   // IsBoolean,
//   IsUUID,
//   IsNumber,
//   Min,
//   Max,
//   IsOptional,
// } from 'class-validator';
// import { PartialType } from '@nestjs/swagger';
// import { CollaboratorRole } from '../entities/collaborator.entity';

// // Base Collaborator DTO

// // Base Collaborator DTO
// export class BaseCollaboratorDto {
//   @IsString()
//   @IsNotEmpty()
//   name: string;

//   @IsEmail()
//   @IsNotEmpty()
//   email: string;

//   @IsEnum(CollaboratorRole) // Validate against the enum
//   @IsNotEmpty()
//   role: CollaboratorRole;

//   @IsString()
//   @IsOptional()
//   spotifyUrl?: string;

//   @IsString()
//   @IsOptional()
//   appleUrl?: string;

//   @IsString()
//   @IsOptional()
//   youtubeUrl?: string;
// }

// // Create Collaborator DTO
// export class CreateCollaboratorDto extends BaseCollaboratorDto {
//   @IsUUID()
//   @IsOptional() // Should be required with authentication
//   createdByUserId?: string;
// }

// // Update Collaborator DTO
// export class UpdateCollaboratorDto extends PartialType(BaseCollaboratorDto) {}

// // Song Collaborator DTOs
// export class BaseSongCollaboratorDto {
//   @IsUUID()
//   @IsNotEmpty()
//   songId: string;

//   @IsUUID()
//   @IsNotEmpty()
//   collaboratorId: string;

//   @IsEnum(CollaboratorRole)
//   @IsNotEmpty()
//   role: CollaboratorRole;

//   @IsNumber()
//   @Min(0)
//   @Max(100)
//   splitPercentage: number;
// }

// // Create Song Collaborator DTO
// export class CreateSongCollaboratorDto extends BaseSongCollaboratorDto {}

// // Update Song Collaborator DTO
// export class UpdateSongCollaboratorDto extends PartialType(
//   BaseSongCollaboratorDto,
// ) {}

// //splisheet dtos

// import { ValidateNested } from 'class-validator';
// import { Type } from 'class-transformer';

// export class CreateSplitSheetEntryDto {
//   @IsNotEmpty()
//   @IsEmail()
//   recipientEmail: string;

//   @IsNotEmpty()
//   @IsNumber()
//   @Min(0)
//   percentage: number;
// }

// export class CreateSplitSheetDto {
//   @IsNotEmpty()
//   songId: string;

//   @ValidateNested({ each: true })
//   @Type(() => CreateSplitSheetEntryDto)
//   entries: CreateSplitSheetEntryDto;
// }

// export class ClaimSplitEntryDto {
//   @IsNotEmpty()
//   encryptedEntryId: string;
// }
// export class UpdateSplitSheetEntryDto {
//   @IsOptional()
//   @IsUUID()
//   id?: string; // Optional for new entries

//   @IsNotEmpty()
//   @IsEmail()
//   recipientEmail: string;

//   @IsNotEmpty()
//   @IsNumber()
//   @Min(0)
//   percentage: number;
// }

// export class UpdateSplitSheetDto {
//   @IsOptional()
//   @ValidateNested({ each: true })
//   @Type(() => UpdateSplitSheetEntryDto)
//   entries: UpdateSplitSheetEntryDto;
// }

//new fixed

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CollaboratorRole } from '../entities/collaborator.entity';

// Base Collaborator DTO
export class BaseCollaboratorDto {
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
  spotifyUrl?: string;

  @IsString()
  @IsOptional()
  appleUrl?: string;

  @IsString()
  @IsOptional()
  youtubeUrl?: string;
}

// Create Collaborator DTO
export class CreateCollaboratorDto extends BaseCollaboratorDto {
  @IsUUID()
  @IsOptional()
  createdByUserId?: string;
}

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
  encryptedEntryId: string;
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
