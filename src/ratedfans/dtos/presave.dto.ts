import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { Trim } from 'class-sanitizer';
import { StreamingPlatform } from '../entities/ratedfans-link.entity';
import { PresaveStatus } from '../entities/presave-signup.entity';

export class PresaveSignupDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Trim()
  email: string;

  @IsEnum(StreamingPlatform, {
    message: 'Please select a valid streaming platform',
  })
  platform: StreamingPlatform;

  @IsOptional()
  @IsObject()
  metadata?: {
    userAgent?: string;
    referer?: string;
    source?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export class ConfirmPresaveDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class PresaveStatsDto {
  platform: StreamingPlatform;
  status: PresaveStatus;
  count: number;
}

export class PresaveResponseDto {
  id: string;
  email: string;
  platform: StreamingPlatform;
  status: PresaveStatus;
  createdAt: Date;
  confirmedAt?: Date;
}
