import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
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
  basicText: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SynchronizedLyricLine)
  synchronizedLyrics: SynchronizedLyricLine[];
}
