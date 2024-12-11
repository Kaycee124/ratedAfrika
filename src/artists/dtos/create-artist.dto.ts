// src/artists/dto/create-artist.dto.ts
import {
  IsString,
  IsEmail,
  IsUrl,
  IsOptional,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class SocialMediaLinksDto {
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @IsOptional()
  @IsUrl()
  twitter?: string;

  @IsOptional()
  @IsUrl()
  facebook?: string;

  @IsOptional()
  @IsUrl()
  spotify?: string;
}

class PaymentInformationDto {
  @IsString()
  type: string;

  @IsObject()
  details: Record<string, any>;
}

export class CreateArtistDto {
  @IsString()
  stageName: string;

  @IsString()
  legalName: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsArray()
  @IsString({ each: true })
  genres: string[];

  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  socialMediaLinks: SocialMediaLinksDto;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => PaymentInformationDto)
  paymentInformation: PaymentInformationDto;
}
