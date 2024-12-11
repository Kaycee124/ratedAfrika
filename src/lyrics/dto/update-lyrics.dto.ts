import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SynchronizedLyricLine {
  @IsNumber()
  @Min(0)
  @ApiProperty({
    description: 'Timestamp in milliseconds for the lyric line',
    example: 1000,
  })
  timestamp: number;

  @IsString()
  @ApiProperty({
    description: 'Text content of the lyric line',
    example: 'First line of the song',
  })
  text: string;
}

export class UpdateLyricsDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Complete lyrics text without timestamps',
    example: 'Verse 1: First line of the song\nSecond line of the song',
    required: false,
  })
  basicText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SynchronizedLyricLine)
  @ApiProperty({
    description: 'Array of synchronized lyrics with timestamps',
    type: [SynchronizedLyricLine],
    required: false,
  })
  synchronizedLyrics?: SynchronizedLyricLine[];
}
