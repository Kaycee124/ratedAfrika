import {
  IsString,
  IsEmail,
  IsUrl,
  IsOptional,
  IsArray,
  ValidateNested,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class MusicPlatformsDto {
  @IsOptional()
  @IsUrl()
  spotify?: string;

  @IsOptional()
  @IsUrl()
  appleMusic?: string;

  @IsOptional()
  @IsUrl()
  amazonMusic?: string;

  @IsOptional()
  @IsUrl()
  deezer?: string;

  @IsOptional()
  @IsUrl()
  audiomack?: string;

  @IsOptional()
  @IsUrl()
  tidal?: string;

  @IsOptional()
  @IsUrl()
  youtube?: string;
}

class SocialMediaLinksDto {
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @IsOptional()
  @IsUrl()
  facebook?: string;

  @IsOptional()
  @IsUrl()
  tiktok?: string;

  @IsOptional()
  @IsUrl()
  x?: string;
}

export class CreateArtistDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  country: string;

  @IsPhoneNumber()
  phoneNumber: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsArray()
  @IsString({ each: true })
  genres: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @ValidateNested()
  @Type(() => MusicPlatformsDto)
  musicPlatforms: MusicPlatformsDto;

  @ValidateNested()
  @Type(() => SocialMediaLinksDto)
  socialMediaLinks: SocialMediaLinksDto;
}
