import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SpotifyUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiProperty()
  @IsString()
  spotifyId: string;

  @ApiProperty()
  @IsOptional()
  password?: string;
}
