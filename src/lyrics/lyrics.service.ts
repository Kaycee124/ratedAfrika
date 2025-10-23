// src/lyrics/lyrics.service.ts
import { Injectable, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Lyrics } from './entities/lyrics.entity';
import { CreateLyricsDto } from './dto/create-lyrics.dto';
import { UpdateLyricsDto } from './dto/update-lyrics.dto';
import { Song } from '../songs/entities/song.entity';
import { NotFoundException } from '../errors/custom-exceptions';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@Injectable()
export class LyricsService {
  private readonly logger = new Logger(LyricsService.name);

  constructor(
    @InjectRepository(Lyrics)
    private lyricsRepository: Repository<Lyrics>,
    @InjectRepository(Song)
    private songRepository: Repository<Song>,
  ) {}

  async create(
    createLyricsDto: CreateLyricsDto,
    userId: string,
  ): Promise<ApiResponse<Lyrics>> {
    const song = await this.songRepository.findOne({
      where: { id: createLyricsDto.songId },
      relations: ['uploadedBy'],
    });

    if (!song) {
      throw new HttpException('Song not found', HttpStatus.NOT_FOUND);
    }

    // Correcting error: Use uploadedBy for ownership check
    if (song.uploadedBy.id !== userId) {
      throw new HttpException(
        'You do not have permission to add lyrics to this song',
        HttpStatus.FORBIDDEN,
      );
    }

    const existingLyrics = await this.lyricsRepository.findOne({
      where: { songId: createLyricsDto.songId },
    });

    if (existingLyrics) {
      throw new HttpException(
        'Lyrics already exist for this song',
        HttpStatus.CONFLICT,
      );
    }

    // Validate content is not empty
    if (
      !createLyricsDto.basicLyrics ||
      createLyricsDto.basicLyrics.trim() === ''
    ) {
      throw new HttpException(
        'Lyrics content cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    const lyrics = this.lyricsRepository.create({
      ...createLyricsDto,
      synchronizedLyrics: createLyricsDto.synchronizedLyrics ?? [],
      createdBy: userId,
      updatedBy: userId,
    });

    const savedLyrics = await this.lyricsRepository.save(lyrics);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Lyrics created successfully',
      data: savedLyrics,
    };
  }

  async update(
    id: string,
    updateLyricsDto: UpdateLyricsDto,
    userId: string,
  ): Promise<ApiResponse<Lyrics>> {
    const lyrics = await this.lyricsRepository.findOne({
      where: { id },
      relations: ['song', 'song.uploadedBy'],
    });

    if (!lyrics) {
      throw new HttpException('Lyrics not found', HttpStatus.NOT_FOUND);
    }

    // Correcting error: Use uploadedBy for ownership check
    if (lyrics.song.uploadedBy.id !== userId) {
      throw new HttpException(
        'You do not have permission to update these lyrics',
        HttpStatus.FORBIDDEN,
      );
    }

    Object.assign(lyrics, updateLyricsDto);
    lyrics.updatedBy = userId;

    const updatedLyrics = await this.lyricsRepository.save(lyrics);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lyrics updated successfully',
      data: updatedLyrics,
    };
  }

  async remove(id: string, userId: string): Promise<ApiResponse> {
    const lyrics = await this.lyricsRepository.findOne({
      where: { id },
      relations: ['song', 'song.uploadedBy'],
    });

    if (!lyrics) {
      throw new HttpException('Lyrics not found', HttpStatus.NOT_FOUND);
    }

    // Correcting error: Use uploadedBy for ownership check
    if (lyrics.song.uploadedBy.id !== userId) {
      throw new HttpException(
        'You do not have permission to delete these lyrics',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.lyricsRepository.remove(lyrics);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lyrics deleted successfully',
    };
  }

  //****************************************** */
  //CODE ABOVE THIS IS EDITED CODE IN QUESTION

  //****************************************** */
  async findBySongId(songId: string): Promise<ApiResponse<Lyrics>> {
    // First, verify the song exists
    const song = await this.songRepository.findOne({
      where: { id: songId },
    });

    if (!song) {
      throw new HttpException('Song not found', HttpStatus.NOT_FOUND);
    }

    // Try to find lyrics without the isComplete filter first
    const lyrics = await this.lyricsRepository.findOne({
      where: { songId },
      order: { version: 'DESC' },
      relations: ['song'], // Include the song relation
    });

    if (!lyrics) {
      throw new NotFoundException('No lyrics found');
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Lyrics retrieved successfully',
      data: {
        ...lyrics,
        basicLyrics: lyrics.basicLyrics || '',
        synchronizedLyrics: lyrics.synchronizedLyrics || [],
      },
    };
  }

  async getLyricsHistory(songId: string): Promise<ApiResponse<Lyrics[]>> {
    // Verify the song exists first
    const song = await this.songRepository.findOne({
      where: { id: songId },
    });

    if (!song) {
      throw new HttpException('Song not found', HttpStatus.NOT_FOUND);
    }

    const lyrics = await this.lyricsRepository.find({
      where: { songId },
      order: { version: 'DESC' },
      relations: ['song'], // Include the song relation
    });

    // Return an empty array instead of error if no lyrics found
    return {
      statusCode: HttpStatus.OK,
      message: lyrics.length
        ? 'Lyrics history retrieved successfully'
        : 'No lyrics history found for this song',
      data: lyrics,
    };
  }

  // Changed from findByArtist to findByUser
  async findByUser(userId: string): Promise<ApiResponse<Lyrics[]>> {
    const lyrics = await this.lyricsRepository.find({
      where: {
        // Find lyrics where the user is either the creator or the song uploader
        createdBy: userId,
      },
      relations: ['song', 'song.uploadedBy'],
      order: { createdAt: 'DESC' },
    });

    // Alternatively, you can also find lyrics where the user uploaded the song
    const songsUploadedByUser = await this.songRepository.find({
      where: { uploadedBy: { id: userId } },
      relations: ['uploadedBy'],
    });

    const songIds = songsUploadedByUser.map((song) => song.id);

    // Find lyrics for songs uploaded by the user (if not already included)
    const additionalLyrics = await this.lyricsRepository.find({
      where: {
        songId: In(songIds),
        createdBy: Not(userId), // Only include those not already found
      },
      relations: ['song', 'song.uploadedBy'],
      order: { createdAt: 'DESC' },
    });

    // Combine both sets of lyrics
    const allLyrics = [...lyrics, ...additionalLyrics];

    if (!allLyrics.length) {
      return {
        statusCode: HttpStatus.OK, // Changed from NOT_FOUND to OK with empty array
        message: 'No lyrics found for this user',
        data: [],
      };
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'User lyrics retrieved successfully',
      data: allLyrics,
    };
  }
}
