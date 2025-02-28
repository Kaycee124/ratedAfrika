// src/lyrics/lyrics.service.ts
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { Lyrics } from './entities/lyrics.entity';
import { CreateLyricsDto } from './dto/create-lyrics.dto';
import { UpdateLyricsDto } from './dto/update-lyrics.dto';
import { Song } from '../songs/entities/song.entity';

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
    try {
      const song = await this.songRepository.findOne({
        where: { id: createLyricsDto.songId },
        relations: ['uploadedBy'],
      });

      if (!song) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Song not found',
        };
      }

      // Correcting error: Use uploadedBy for ownership check
      if (song.uploadedBy.id !== userId) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have permission to add lyrics to this song',
        };
      }

      const existingLyrics = await this.lyricsRepository.findOne({
        where: { songId: createLyricsDto.songId },
      });

      if (existingLyrics) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Lyrics already exist for this song',
        };
      }

      // Validate content is not empty
      if (
        !createLyricsDto.basicLyrics ||
        createLyricsDto.basicLyrics.trim() === ''
      ) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Lyrics content cannot be empty',
        };
      }

      const lyrics = this.lyricsRepository.create({
        ...createLyricsDto,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedLyrics = await this.lyricsRepository.save(lyrics);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Lyrics created successfully',
        data: savedLyrics,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create lyrics: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while creating lyrics',
      };
    }
  }

  async update(
    id: string,
    updateLyricsDto: UpdateLyricsDto,
    userId: string,
  ): Promise<ApiResponse<Lyrics>> {
    try {
      const lyrics = await this.lyricsRepository.findOne({
        where: { id },
        relations: ['song', 'song.uploadedBy'],
      });

      if (!lyrics) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Lyrics not found',
        };
      }

      // Correcting error: Use uploadedBy for ownership check
      if (lyrics.song.uploadedBy.id !== userId) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have permission to update these lyrics',
        };
      }

      Object.assign(lyrics, updateLyricsDto);
      lyrics.updatedBy = userId;

      const updatedLyrics = await this.lyricsRepository.save(lyrics);

      return {
        statusCode: HttpStatus.OK,
        message: 'Lyrics updated successfully',
        data: updatedLyrics,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update lyrics: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while updating lyrics',
      };
    }
  }

  async remove(id: string, userId: string): Promise<ApiResponse> {
    try {
      const lyrics = await this.lyricsRepository.findOne({
        where: { id },
        relations: ['song', 'song.uploadedBy'],
      });

      if (!lyrics) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Lyrics not found',
        };
      }

      // Correcting error: Use uploadedBy for ownership check
      if (lyrics.song.uploadedBy.id !== userId) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You do not have permission to delete these lyrics',
        };
      }

      await this.lyricsRepository.remove(lyrics);

      return {
        statusCode: HttpStatus.OK,
        message: 'Lyrics deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to delete lyrics: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while deleting lyrics',
      };
    }
  }

  //****************************************** */
  //CODE ABOVE THIS IS EDITED CODE IN QUESTION

  //****************************************** */
  async findBySongId(songId: string): Promise<ApiResponse<Lyrics>> {
    try {
      // First, verify the song exists
      const song = await this.songRepository.findOne({
        where: { id: songId },
      });

      if (!song) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Song not found',
        };
      }

      // Try to find lyrics without the isComplete filter first
      const lyrics = await this.lyricsRepository.findOne({
        where: { songId },
        order: { version: 'DESC' },
        relations: ['song'], // Include the song relation
      });

      if (!lyrics) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Lyrics not found for this song',
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Lyrics retrieved successfully',
        data: lyrics,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch lyrics: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching the lyrics',
      };
    }
  }

  async getLyricsHistory(songId: string): Promise<ApiResponse<Lyrics[]>> {
    try {
      // Verify the song exists first
      const song = await this.songRepository.findOne({
        where: { id: songId },
      });

      if (!song) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Song not found',
        };
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
    } catch (error) {
      this.logger.error(
        `Failed to fetch lyrics history: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching the lyrics history',
      };
    }
  }

  // Changed from findByArtist to findByUser
  async findByUser(userId: string): Promise<ApiResponse<Lyrics[]>> {
    try {
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
    } catch (error) {
      this.logger.error(
        `Failed to fetch user lyrics: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while fetching user lyrics',
      };
    }
  }
}
