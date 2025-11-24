import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ArtistType {
  PLATFORM = 'platform',
  TEMP = 'temp',
}

export class RemoveArtistFromSongDto {
  @ApiProperty({ enum: ArtistType, description: 'Type of artist to remove' })
  @IsEnum(ArtistType)
  type: ArtistType;
}

export class UpdateSongTempArtistDto {
  @ApiProperty({ description: 'New name for the temp artist', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Spotify URL', required: false })
  @IsOptional()
  @IsUrl()
  spotifyUrl?: string;

  @ApiProperty({ description: 'Apple Music URL', required: false })
  @IsOptional()
  @IsUrl()
  appleMusicUrl?: string;

  @ApiProperty({ description: 'YouTube URL', required: false })
  @IsOptional()
  @IsUrl()
  youtubeUrl?: string;
}
