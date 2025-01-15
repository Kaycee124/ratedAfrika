import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum UpdateType {
  EMAIL = 'email',
  NAME = 'name',
  PHONE = 'phone',
  COUNTRY = 'country',
  PROFILE_IMAGE = 'profileImage',
}

export class InitiateUpdateDto {
  @IsEnum(UpdateType)
  @IsNotEmpty()
  updateType: UpdateType;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class VerifyUpdateDto {
  @IsString()
  @IsNotEmpty()
  otp: string;

  @IsUUID()
  @IsNotEmpty()
  requestId: string;
}

export class UpdateRequestMetadata {
  @IsUUID()
  userId: string;

  @IsEnum(UpdateType)
  updateType: UpdateType;

  @IsNotEmpty()
  newValue: any;

  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  isVerified: boolean;

  attempts: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}

export class InitiateUpdateResponseDto {
  statusCode: number;
  message: string;
  requestId: string;
  expiresIn?: number;
}

export class VerifyUpdateResponseDto {
  statusCode: number;
  message: string;
  data?: Record<string, any>;
}
