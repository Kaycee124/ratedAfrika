// src/lyrics/lyrics.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LyricsService } from './lyrics.service';
import { CreateLyricsDto } from './dto/create-lyrics.dto';
import { UpdateLyricsDto } from './dto/update-lyrics.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import { ApiResponse } from 'src/common/types/apiresponse';
import { Lyrics } from './entities/lyrics.entity';

@ApiTags('Lyrics')
@Controller('lyrics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LyricsController {
  constructor(private readonly lyricsService: LyricsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new lyrics for a song' })
  @SwaggerResponse({
    status: HttpStatus.CREATED,
    description: 'Lyrics have been successfully created.',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createLyricsDto: CreateLyricsDto,
    @Request() req,
  ): Promise<ApiResponse<Lyrics>> {
    const userId = req.user.id; // Extract user ID from JWT payload
    return this.lyricsService.create(createLyricsDto, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update existing lyrics' })
  @ApiParam({ name: 'id', description: 'Lyrics ID' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Lyrics have been successfully updated.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateLyricsDto: UpdateLyricsDto,
    @Request() req,
  ): Promise<ApiResponse<Lyrics>> {
    const userId = req.user.id;
    return this.lyricsService.update(id, updateLyricsDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lyrics' })
  @ApiParam({ name: 'id', description: 'Lyrics ID' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Lyrics have been successfully deleted.',
  })
  async remove(@Param('id') id: string, @Request() req): Promise<ApiResponse> {
    const userId = req.user.id;
    return this.lyricsService.remove(id, userId);
  }

  @Get('song/:songId')
  @ApiOperation({ summary: 'Get current lyrics for a song' })
  @ApiParam({ name: 'songId', description: 'Song ID' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Lyrics have been successfully retrieved.',
  })
  async findBySongId(
    @Param('songId') songId: string,
  ): Promise<ApiResponse<Lyrics>> {
    return this.lyricsService.findBySongId(songId);
  }

  @Get('song/:songId/history')
  @ApiOperation({ summary: 'Get lyrics version history for a song' })
  @ApiParam({ name: 'songId', description: 'Song ID' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Lyrics history has been successfully retrieved.',
  })
  async getLyricsHistory(
    @Param('songId') songId: string,
  ): Promise<ApiResponse<Lyrics[]>> {
    return this.lyricsService.getLyricsHistory(songId);
  }

  @Get('artist/:artistId')
  @ApiOperation({ summary: 'Get all lyrics for an artist' })
  @ApiParam({ name: 'artistId', description: 'Artist ID' })
  @SwaggerResponse({
    status: HttpStatus.OK,
    description: 'Artist lyrics have been successfully retrieved.',
  })
  async findByArtist(
    @Param('artistId') artistId: string,
  ): Promise<ApiResponse<Lyrics[]>> {
    return this.lyricsService.findByArtist(artistId);
  }
}
