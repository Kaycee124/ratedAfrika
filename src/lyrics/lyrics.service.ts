// // src/lyrics/lyrics.service.ts
// import { Injectable, Logger, HttpStatus } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Lyrics } from './entities/lyrics.entity';
// import { CreateLyricsDto } from './dto/create-lyrics.dto';
// import { UpdateLyricsDto } from './dto/update-lyrics.dto';
// import { Song } from '../songs/entities/song.entity';

// interface ApiResponse<T = any> {
//   statusCode: number;
//   message: string;
//   data?: T;
// }

// @Injectable()
// export class LyricsService {
//   private readonly logger = new Logger(LyricsService.name);

//   constructor(
//     @InjectRepository(Lyrics)
//     private lyricsRepository: Repository<Lyrics>,
//     @InjectRepository(Song)
//     private songRepository: Repository<Song>,
//   ) {}

//   async create(
//     createLyricsDto: CreateLyricsDto,
//     userId: string,
//   ): Promise<ApiResponse<Lyrics>> {
//     try {
//       // Find the song first
//       const song = await this.songRepository.findOne({
//         where: { id: createLyricsDto.songId },
//         relations: ['artist', 'artist.user'],
//       });

//       if (!song) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Song not found',
//         };
//       }

//       // Verify ownership - check if the user is the song's artist
//       if (song.artist.user.id !== userId) {
//         return {
//           statusCode: HttpStatus.FORBIDDEN,
//           message: 'You do not have permission to add lyrics to this song',
//         };
//       }

//       // Check if lyrics already exist for this song
//       const existingLyrics = await this.lyricsRepository.findOne({
//         where: { songId: createLyricsDto.songId },
//       });

//       if (existingLyrics) {
//         return {
//           statusCode: HttpStatus.CONFLICT,
//           message: 'Lyrics already exist for this song',
//         };
//       }

//       // Create new lyrics
//       const lyrics = this.lyricsRepository.create({
//         ...createLyricsDto,
//         createdBy: userId,
//         updatedBy: userId,
//       });

//       const savedLyrics = await this.lyricsRepository.save(lyrics);

//       return {
//         statusCode: HttpStatus.CREATED,
//         message: 'Lyrics created successfully',
//         data: savedLyrics,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to create lyrics: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while creating lyrics',
//       };
//     }
//   }
//   async update(
//     id: string,
//     updateLyricsDto: UpdateLyricsDto,
//     userId: string,
//   ): Promise<ApiResponse<Lyrics>> {
//     try {
//       const lyrics = await this.lyricsRepository.findOne({
//         where: { id },
//         relations: ['song', 'song.artist', 'song.artist.user'],
//       });

//       if (!lyrics) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Lyrics not found',
//         };
//       }

//       // Verify ownership
//       if (lyrics.song.artist.user.id !== userId) {
//         return {
//           statusCode: HttpStatus.FORBIDDEN,
//           message: 'You do not have permission to update these lyrics',
//         };
//       }

//       // Update lyrics
//       Object.assign(lyrics, updateLyricsDto);
//       lyrics.updatedBy = userId;

//       const updatedLyrics = await this.lyricsRepository.save(lyrics);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Lyrics updated successfully',
//         data: updatedLyrics,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to update lyrics: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while updating lyrics',
//       };
//     }
//   }

//   async remove(id: string, userId: string): Promise<ApiResponse> {
//     try {
//       const lyrics = await this.lyricsRepository.findOne({
//         where: { id },
//         relations: ['song', 'song.artist', 'song.artist.user'],
//       });

//       if (!lyrics) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Lyrics not found',
//         };
//       }

//       // Verify ownership
//       if (lyrics.song.artist.user.id !== userId) {
//         return {
//           statusCode: HttpStatus.FORBIDDEN,
//           message: 'You do not have permission to delete these lyrics',
//         };
//       }

//       await this.lyricsRepository.remove(lyrics);

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Lyrics deleted successfully',
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to delete lyrics: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while deleting lyrics',
//       };
//     }
//   }

//   async findBySongId(songId: string): Promise<ApiResponse<Lyrics>> {
//     try {
//       const lyrics = await this.lyricsRepository.findOne({
//         where: { songId, isComplete: true },
//         order: { version: 'DESC' },
//       });

//       if (!lyrics) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'Lyrics not found',
//         };
//       }

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Lyrics retrieved successfully',
//         data: lyrics,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to fetch lyrics: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching the lyrics',
//       };
//     }
//   }

//   async getLyricsHistory(songId: string): Promise<ApiResponse<Lyrics[]>> {
//     try {
//       const lyrics = await this.lyricsRepository.find({
//         where: { songId },
//         order: { version: 'DESC' },
//       });

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Lyrics history retrieved successfully',
//         data: lyrics,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to fetch lyrics history: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching the lyrics history',
//       };
//     }
//   }

//   async findByArtist(artistId: string): Promise<ApiResponse<Lyrics[]>> {
//     try {
//       const lyrics = await this.lyricsRepository.find({
//         where: { song: { artist: { id: artistId } } },
//         relations: ['song', 'song.artist'],
//         order: { createdAt: 'DESC' },
//       });

//       if (!lyrics.length) {
//         return {
//           statusCode: HttpStatus.NOT_FOUND,
//           message: 'No lyrics found for this artist',
//         };
//       }

//       return {
//         statusCode: HttpStatus.OK,
//         message: 'Artist lyrics retrieved successfully',
//         data: lyrics,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to fetch artist lyrics: ${error.message}`,
//         error.stack,
//       );
//       return {
//         statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//         message: 'An error occurred while fetching artist lyrics',
//       };
//     }
//   }

//   private validateSynchronizedLyrics(
//     lyrics: { timestamp: number; text: string }[],
//     songDuration: number,
//   ): void {
//     if (lyrics.length === 0) {
//       throw new Error('Synchronized lyrics cannot be empty');
//     }

//     for (let i = 1; i < lyrics.length; i++) {
//       if (lyrics[i].timestamp <= lyrics[i - 1].timestamp) {
//         throw new Error('Timestamps must be sequential');
//       }
//     }

//     if (lyrics[lyrics.length - 1].timestamp > songDuration) {
//       throw new Error('Timestamps cannot exceed song duration');
//     }
//   }
// }
