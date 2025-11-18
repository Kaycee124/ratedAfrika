// src/songs/dtos/song-artist.dto.ts
import {
  IsString,
  IsUUID,
  IsOptional,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddArtistToSongDto {
  @ApiProperty({
    description: 'ID of an existing platform artist',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  artistId?: string;

  @ApiProperty({
    description: 'Name for a temporary/non-platform artist',
    required: false,
  })
  @ValidateIf((o) => !o.artistId) // Required if artistId is missing
  @IsString()
  @IsNotEmpty()
  tempArtistName?: string;
}

export class SongArtistsResponseDto {
  primaryArtist: any;
  featuredPlatformArtists: any[];
  featuredTempArtists: any[];
  totalArtists: number;
}
