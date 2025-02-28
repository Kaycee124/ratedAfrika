import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class SynchronizedLyricLine {
  @IsNumber()
  @Min(0)
  timestamp: number;

  @IsString()
  text: string;
}

export class CreateLyricsDto {
  @IsString()
  songId: string;

  @IsString()
  basicLyrics: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SynchronizedLyricLine)
  synchronizedLyrics: SynchronizedLyricLine[];
}
