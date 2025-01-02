// src/users/dto/update.dto.ts

import {
  IsString,
  IsEmail,
  IsUrl,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
  IsISO31661Alpha2,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNameDto {
  @ApiProperty({
    description: "User's new name",
    minLength: 2,
    maxLength: 100,
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}

export class UpdateEmailDto {
  @ApiProperty({
    description: "User's new email address",
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class UpdateProfileImageDto {
  @ApiProperty({
    description: 'URL of the new profile image',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  @IsUrl({}, { message: 'Please provide a valid URL for the profile image' })
  profileImage: string;
}

export class UpdatePhoneDto {
  @ApiProperty({
    description: "User's phone number in international format (E.164)",
    example: '+1234567890',
    pattern: '^+[1-9]d{1,14}$',
  })
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in international format (E.164). Example: +1234567890',
  })
  phoneNumber: string;
}

export class UpdateCountryDto {
  @ApiProperty({
    description: 'Country code in ISO 3166-1 alpha-2 format',
    example: 'US',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsISO31661Alpha2({
    message: 'Please provide a valid ISO 3166-1 alpha-2 country code',
  })
  country: string;
}

// Legacy DTO for backward compatibility
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "User's name",
    minLength: 2,
    maxLength: 100,
    example: 'John Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: "User's email address",
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'URL of the profile image',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Please provide a valid URL for the profile image' })
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Phone number in international format (E.164)',
    example: '+1234567890',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in international format (E.164). Example: +1234567890',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Country code in ISO 3166-1 alpha-2 format',
    example: 'US',
  })
  @IsOptional()
  @IsISO31661Alpha2({
    message: 'Please provide a valid ISO 3166-1 alpha-2 country code',
  })
  country?: string;
}
