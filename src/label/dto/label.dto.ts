// src/labels/dto/label.dto.ts

import {
  IsString,
  IsEmail,
  IsUrl,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

//-------------------------------------------------------
// Nested DTOs for Social Media and Contact Information
//-------------------------------------------------------

// This DTO handles validation for social media links
// Each field is optional but must be a valid URL if provided
export class SocialMediaLinksDto {
  @IsOptional()
  @IsUrl({}, { message: 'Invalid Instagram URL format' })
  instagram?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid Twitter URL format' })
  twitter?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid Facebook URL format' })
  facebook?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid YouTube URL format' })
  youtube?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Invalid website URL format' })
  website?: string;
}

// This DTO validates contact information
// Email is required, all other fields are optional
export class ContactInformationDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'City must be a string' })
  city?: string;

  @IsOptional()
  @IsString({ message: 'Country must be a string' })
  country?: string;
}

//-------------------------------------------------------
// Create Label DTO
//-------------------------------------------------------

// Main DTO used when creating a new label
// Contains all required and optional fields for label creation
export class CreateLabelDto {
  @IsString({ message: 'Label name must be a string' })
  @IsNotEmpty({ message: 'Label name is required' })
  labelName: string;

  @IsString({ message: 'Legal entity name must be a string' })
  @IsNotEmpty({ message: 'Legal entity name is required' })
  legalEntityName: string;

  @IsOptional()
  @IsString({ message: 'Logo must be a string' })
  logo?: string;

  @IsOptional()
  @IsString({ message: 'Bio must be a string' })
  bio?: string;

  @IsArray({ message: 'Genres must be an array' })
  @IsString({ each: true, message: 'Each genre must be a string' })
  @IsNotEmpty({ message: 'Genres array cannot be empty' })
  genres: string[];

  @IsObject({ message: 'Social media links must be an object' })
  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  socialMediaLinks: SocialMediaLinksDto;

  @IsObject({ message: 'Contact information must be an object' })
  @ValidateNested()
  @Type(() => ContactInformationDto)
  contactInformation: ContactInformationDto;

  @IsOptional()
  @IsString({ message: 'Tax ID must be a string' })
  taxId?: string;

  @IsOptional()
  @IsString({ message: 'Business registration number must be a string' })
  businessRegistrationNumber?: string;
}

//-------------------------------------------------------
// Update Label DTO
//-------------------------------------------------------

// DTO for updating an existing label
// Makes all fields from CreateLabelDto optional
export class UpdateLabelDto extends PartialType(CreateLabelDto) {}

//-------------------------------------------------------
// Query Label DTO
//-------------------------------------------------------

// DTO for querying labels with pagination and filters
export class QueryLabelDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than 0' })
  page: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit: number = 10;

  @IsOptional()
  @IsString({ message: 'Genre must be a string' })
  genre?: string;

  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;
}
