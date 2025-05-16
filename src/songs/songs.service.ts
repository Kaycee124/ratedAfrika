// src/songs/songs.service.ts
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song, SongStatus, ReleaseType } from './entities/song.entity';
import {
  ReleaseContainer,
  ReleaseContainerStatus,
  ReleaseContainerType,
} from './entities/album.entity';
import { Artist } from '../artists/entities/artist.entity';
import { TempArtist } from '../artists/entities/temp-artist.entity';
import { User } from '../users/user.entity';
import { FileBase } from 'src/storage/entities/file-base.entity';
import {
  CreateSongDto,
  UpdateSongDto,
  QuerySongDto,
  CreateReleaseContainerDto,
  UpdateReleaseContainerDto,
  QueryReleaseContainerDto,
  TempArtistDto,
  DiscographyResponseDto,
} from './dtos/song.dto';
import { AudioFile } from 'src/storage/entities/audio-file.entity';
import { ImageFile } from 'src/storage/entities/image-file.entity';
import { VideoFile } from 'src/storage/entities/video-file.entity';
import { StorageService } from 'src/storage/services/storage.service';
import { SplitSheetService } from 'src/collaborators/splitsheet.service';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}
interface ReviewSubmissionResponse {
  song?: Song;
  validationDetails?: {
    isValid: boolean;
    missingFields?: string[];
  };
}

@Injectable()
export class SongsService {
  private readonly logger = new Logger(SongsService.name);

  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(ReleaseContainer)
    private readonly releaseContainerRepository: Repository<ReleaseContainer>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(TempArtist)
    private readonly tempArtistRepository: Repository<TempArtist>,
    @InjectRepository(FileBase)
    private readonly fileBaseRepository: Repository<FileBase>,
    @InjectRepository(AudioFile)
    private readonly audioFileRepository: Repository<AudioFile>,

    @InjectRepository(ImageFile)
    private readonly imageFileRepository: Repository<ImageFile>,

    @InjectRepository(VideoFile)
    private readonly videoFileRepository: Repository<VideoFile>,
    private readonly storageService: StorageService,
    private readonly splitSheetService: SplitSheetService,
  ) {}

  private async checkFileOwnershipOrExistence(
    fileId: string | undefined,
    user: User,
    fieldName: string,
  ): Promise<ApiResponse | null> {
    if (!fileId) {
      return null;
    }

    let file: FileBase | null = null;

    // Check each type of file
    const repositories = [
      this.audioFileRepository,
      this.imageFileRepository,
      this.videoFileRepository,
    ];

    for (const repository of repositories) {
      file = await repository.findOne({
        where: { id: fileId },
        relations: ['uploadedBy'],
      });

      if (file) break;
    }

    if (!file) {
      this.logger.warn(`File not found for '${fieldName}' with ID '${fileId}'`);
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: `File for '${fieldName}' with ID '${fileId}' not found in the system.`,
      };
    }

    // Log file details for debugging
    console.log('File details retrieved', {
      id: file.id,
      filename: file.filename,
      type:
        file instanceof AudioFile
          ? 'audio'
          : file instanceof ImageFile
            ? 'image'
            : 'video',
      uploadedById: file.uploadedBy?.id,
    });

    // Optional: Add ownership check if needed
    if (user && file.uploadedBy?.id !== user.id) {
      this.logger.warn(`Access denied for user ${user.id} to file ${fileId}`);
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: `File for '${fieldName}' with ID '${fileId}' not accessible by this user.`,
      };
    }

    return null;
  }
  // Release Container (Album/EP) Methods
  async createReleaseContainer(
    createDto: CreateReleaseContainerDto,
    user: User,
  ): Promise<ApiResponse<ReleaseContainer>> {
    try {
      // 1) Verify the file ID (coverArtId) if provided
      const coverArtError = await this.checkFileOwnershipOrExistence(
        createDto.coverArtId,
        user,
        'coverArtId',
      );
      if (coverArtError) {
        return coverArtError;
      }
      // Verify primary artist exists and user has permission
      const primaryArtist = await this.artistRepository.findOne({
        where: { id: createDto.primaryArtistId, user: { id: user.id } }, // Changed from createDto.primaryArtist.id
      });

      if (!primaryArtist) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Primary artist not found or unauthorized',
        };
      }

      // Process temporary featured artists
      const tempFeaturedArtists = createDto.tempFeaturedArtists
        ? await Promise.all(
            createDto.tempFeaturedArtists.map((artistDto) =>
              this.createOrUpdateTempArtist(artistDto),
            ),
          )
        : [];

      // Create release container
      const container = this.releaseContainerRepository.create({
        ...createDto,
        primaryArtist,
        featuredTempArtists: tempFeaturedArtists,
        uploadedBy: user,
        status: ReleaseContainerStatus.DRAFT,
        uploadedTracks: 0,
      });

      const savedContainer =
        await this.releaseContainerRepository.save(container);

      return {
        statusCode: HttpStatus.CREATED,
        message: `${container.type} created successfully`,
        data: savedContainer,
      };
    } catch (error) {
      this.logger.error(`Failed to create release container: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create release container',
      };
    }
  }

  async updateReleaseContainer(
    id: string,
    updateDto: UpdateReleaseContainerDto,
    user: User,
  ): Promise<ApiResponse<ReleaseContainer>> {
    try {
      const container = await this.releaseContainerRepository.findOne({
        where: { id, uploadedBy: { id: user.id } },
        relations: ['primaryArtist', 'featuredTempArtists', 'tracks'],
      });

      if (!container) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Release container not found or unauthorized',
        };
      }

      // Process temp featured artists updates if provided
      if (updateDto.tempFeaturedArtists) {
        const updatedTempArtists = await Promise.all(
          updateDto.tempFeaturedArtists.map((artistDto) =>
            this.createOrUpdateTempArtist(artistDto),
          ),
        );
        container.featuredTempArtists = updatedTempArtists;
      }

      // 2) Verify the file ID if provided
      if (updateDto.coverArtId) {
        const coverArtError = await this.checkFileOwnershipOrExistence(
          updateDto.coverArtId,
          user,
          'coverArtId',
        );
        if (coverArtError) {
          return coverArtError;
        }
      }

      // Update fields
      Object.assign(container, updateDto);
      const updatedContainer =
        await this.releaseContainerRepository.save(container);

      return {
        statusCode: HttpStatus.OK,
        message: `${container.type} updated successfully`,
        data: updatedContainer,
      };
    } catch (error) {
      this.logger.error(`Failed to update release container: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update release container',
      };
    }
  }

  async submitReleaseContainerForReview(
    id: string,
    user: User,
  ): Promise<ApiResponse<ReleaseContainer>> {
    try {
      // Load container with tracks
      const container = await this.releaseContainerRepository.findOne({
        where: { id, uploadedBy: { id: user.id } },
        relations: ['tracks'],
      });

      if (!container) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Release container not found or unauthorized',
        };
      }

      // Check if all expected tracks are present
      if (container.tracks.length < container.totalTracks) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Not all tracks have been uploaded. Expected: ${container.totalTracks}, Current: ${container.tracks.length}`,
        };
      }

      // Update container status
      container.status = ReleaseContainerStatus.PENDING_REVIEW;
      const updatedContainer =
        await this.releaseContainerRepository.save(container);

      return {
        statusCode: HttpStatus.OK,
        message: `${container.type} submitted for review`,
        data: updatedContainer,
      };
    } catch (error) {
      this.logger.error(
        `Failed to submit release container for review: ${error.message}`,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to submit for review',
      };
    }
  }

  // Song Methods
  async createSong(
    createDto: CreateSongDto,
    user: User,
  ): Promise<ApiResponse<Song>> {
    try {
      // First verify the primary artist exists and belongs to user
      const primaryArtist = await this.artistRepository.findOne({
        where: { id: createDto.primaryArtistId, user: { id: user.id } },
      });

      if (!primaryArtist) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Primary artist not found or unauthorized',
        };
      }
      // 2) Verify required file IDs
      // -- coverArtId
      const coverArtError = await this.checkFileOwnershipOrExistence(
        createDto.coverArtId,
        user,
        'coverArtId',
      );
      if (coverArtError) return coverArtError;

      // -- masterTrackId
      const masterTrackError = await this.checkFileOwnershipOrExistence(
        createDto.masterTrackId,
        user,
        'masterTrackId',
      );
      if (masterTrackError) return masterTrackError;

      // 3) Verify optional arrays
      // -- mixVersions
      if (createDto.mixVersions && createDto.mixVersions.length) {
        for (const [index, mv] of createDto.mixVersions.entries()) {
          const mvError = await this.checkFileOwnershipOrExistence(
            mv.fileId,
            user,
            `mixVersions[${index}].fileId`,
          );
          if (mvError) return mvError;
        }
      }

      // // -- previewClip
      // if (createDto.previewClip && createDto.previewClip.fileId) {
      //   const previewClipError = await this.checkFileOwnershipOrExistence(
      //     createDto.previewClip.fileId,
      //     user,
      //     'previewClip.fileId',
      //   );
      //   if (previewClipError) return previewClipError;
      // }

      // -- musicVideo
      if (createDto.musicVideo && createDto.musicVideo.thumbnailId) {
        const musicVideoError = await this.checkFileOwnershipOrExistence(
          createDto.musicVideo.thumbnailId,
          user,
          'musicVideo.thumbnailId',
        );
        if (musicVideoError) return musicVideoError;
      }

      // Validate release container if provided
      if (createDto.releaseContainerId) {
        const container = await this.releaseContainerRepository.findOne({
          where: {
            id: createDto.releaseContainerId,
            uploadedBy: { id: user.id },
          },
          relations: ['tracks'],
        });

        if (!container) {
          return {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Release container not found or unauthorized',
          };
        }

        if (container.uploadedTracks >= container.totalTracks) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `${container.type} already has all tracks uploaded`,
          };
        }

        // Validate track number if provided
        if (createDto.trackNumber) {
          const trackExists = container.tracks.some(
            (t) => t.trackNumber === createDto.trackNumber,
          );
          if (trackExists) {
            return {
              statusCode: HttpStatus.CONFLICT,
              message: `Track number ${createDto.trackNumber} is already taken`,
            };
          }
        }
      }

      // Process temporary featured artists
      const tempFeaturedArtists = createDto.tempFeaturedArtists
        ? await Promise.all(
            createDto.tempFeaturedArtists.map((artistDto) =>
              this.createOrUpdateTempArtist(artistDto),
            ),
          )
        : [];

      // Create song
      const song = this.songRepository.create({
        ...createDto,
        uploadedBy: user,
        status: SongStatus.DRAFT,
        featuredTempArtists: tempFeaturedArtists,
        primaryArtist,
      });

      const savedSong = await this.songRepository.save(song);

      // Update release container if applicable
      if (createDto.releaseContainerId) {
        await this.releaseContainerRepository.update(
          { id: createDto.releaseContainerId },
          { uploadedTracks: () => 'uploadedTracks + 1' },
        );
      }

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Song created successfully',
        data: savedSong,
      };
    } catch (error) {
      this.logger.error(`Failed to create song: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to create song',
      };
    }
  }

  async updateSong(
    id: string,
    updateDto: UpdateSongDto,
    user: User,
  ): Promise<ApiResponse<Song>> {
    try {
      const song = await this.songRepository.findOne({
        where: { id, uploadedBy: { id: user.id } },
        relations: ['releaseContainer', 'featuredTempArtists'],
      });

      if (!song) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Song not found or unauthorized',
        };
      }

      // 2) If user is providing a new coverArtId, verify
      if (updateDto.coverArtId) {
        const coverArtError = await this.checkFileOwnershipOrExistence(
          updateDto.coverArtId,
          user,
          'coverArtId',
        );
        if (coverArtError) return coverArtError;
      }

      // 3) If user is providing new mixVersions, verify each
      if (updateDto.mixVersions) {
        for (const [index, mv] of updateDto.mixVersions.entries()) {
          const mvError = await this.checkFileOwnershipOrExistence(
            mv.fileId,
            user,
            `mixVersions[${index}].fileId`,
          );
          if (mvError) return mvError;
        }
      }

      // 4) If user is providing a previewClip, verify
      if (updateDto.previewClip && updateDto.previewClip.fileId) {
        const previewClipError = await this.checkFileOwnershipOrExistence(
          updateDto.previewClip.fileId,
          user,
          'previewClip.fileId',
        );
        if (previewClipError) return previewClipError;
      }

      // 5) If user is providing a musicVideo, verify the thumbnail
      if (updateDto.musicVideo && updateDto.musicVideo.thumbnailId) {
        const musicVideoError = await this.checkFileOwnershipOrExistence(
          updateDto.musicVideo.thumbnailId,
          user,
          'musicVideo.thumbnailId',
        );
        if (musicVideoError) return musicVideoError;
      }

      // Process temp featured artists updates if provided
      if (updateDto.tempFeaturedArtists) {
        const updatedTempArtists = await Promise.all(
          updateDto.tempFeaturedArtists.map((artistDto) =>
            this.createOrUpdateTempArtist(artistDto),
          ),
        );
        song.featuredTempArtists = updatedTempArtists;
      }

      // Update fields
      Object.assign(song, updateDto);
      const updatedSong = await this.songRepository.save(song);

      return {
        statusCode: HttpStatus.OK,
        message: 'Song updated successfully',
        data: updatedSong,
      };
    } catch (error) {
      this.logger.error(`Failed to update song: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to update song',
      };
    }
  }

  async submitSongForReview(
    id: string,
    user: User,
  ): Promise<ApiResponse<ReviewSubmissionResponse>> {
    try {
      const song = await this.songRepository.findOne({
        where: { id, uploadedBy: { id: user.id } },
        relations: ['releaseContainer'],
      });

      if (!song) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Song not found or unauthorized',
        };
      }

      // Validate all required fields are present
      const validationResult = await this.validateSongCompleteness(song);
      if (!validationResult.isValid) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Song is incomplete',
          data: {
            song,
            validationDetails: validationResult,
          },
        };
      }

      song.status = SongStatus.PENDING_REVIEW;
      const updatedSong = await this.songRepository.save(song);

      return {
        statusCode: HttpStatus.OK,
        message: 'Song submitted for review',
        data: {
          song: updatedSong,
          validationDetails: {
            isValid: true,
            missingFields: [],
          },
        },
      };
    } catch (error) {
      this.logger.error(`Failed to submit song for review: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to submit for review',
      };
    }
  }

  // Helper Methods
  private async createOrUpdateTempArtist(
    artistDto: TempArtistDto,
  ): Promise<TempArtist> {
    const existingArtist = await this.tempArtistRepository.findOne({
      where: { name: artistDto.name },
    });

    if (existingArtist) {
      Object.assign(existingArtist, artistDto);
      return this.tempArtistRepository.save(existingArtist);
    }

    const newArtist = this.tempArtistRepository.create(artistDto);
    return this.tempArtistRepository.save(newArtist);
  }

  private async validateSongCompleteness(song: Song): Promise<{
    isValid: boolean;
    missingFields?: string[];
  }> {
    const missingFields = [];

    // Check required fields
    if (!song.title) missingFields.push('title');
    if (!song.masterTrackId) missingFields.push('masterTrack');
    if (!song.coverArtId) missingFields.push('coverArt');
    if (!song.primaryGenre) missingFields.push('primaryGenre');
    if (!song.releaseLanguage) missingFields.push('releaseLanguage');
    if (!song.label) missingFields.push('label');
    if (!song.proposedReleaseDate) missingFields.push('proposedReleaseDate');
    if (!song.releaseTime) missingFields.push('releaseTime');
    if (!song.trackPrice) missingFields.push('trackPrice');
    if (!song.targetStores || song.targetStores.length === 0)
      missingFields.push('targetStores');
    if (!song.targetCountries || song.targetCountries.length === 0)
      missingFields.push('targetCountries');

    // Check if part of release container and has required fields
    if (song.releaseContainer) {
      if (!song.trackNumber) missingFields.push('trackNumber');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    };
  }

  // Continuing SongsService implementation...

  async querySongs(
    queryDto: QuerySongDto,
    user: User,
  ): Promise<
    ApiResponse<{
      songs: Song[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    try {
      const { page = 1, limit = 10 } = queryDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.songRepository
        .createQueryBuilder('song')
        .leftJoinAndSelect('song.primaryArtist', 'primaryArtist')
        .leftJoinAndSelect('song.featuredPlatformArtists', 'featuredArtists')
        .leftJoinAndSelect('song.featuredTempArtists', 'tempArtists')
        .leftJoinAndSelect('song.releaseContainer', 'releaseContainer')
        .where('song.uploadedBy = :userId', { userId: user.id });

      // Apply filters
      if (queryDto.search) {
        queryBuilder.andWhere(
          '(LOWER(song.title) LIKE LOWER(:search) OR LOWER(song.description) LIKE LOWER(:search))',
          { search: `%${queryDto.search}%` },
        );
      }

      if (queryDto.genre) {
        queryBuilder.andWhere(
          '(song.primaryGenre = :genre OR :genre = ANY(song.secondaryGenres))',
          { genre: queryDto.genre },
        );
      }

      if (queryDto.status) {
        queryBuilder.andWhere('song.status = :status', {
          status: queryDto.status,
        });
      }

      if (queryDto.releaseType) {
        queryBuilder.andWhere('song.releaseType = :releaseType', {
          releaseType: queryDto.releaseType,
        });
      }

      if (queryDto.artistId) {
        queryBuilder.andWhere(
          '(song.primaryArtist.id = :artistId OR :artistId = ANY(song.featuredPlatformArtists))',
          { artistId: queryDto.artistId },
        );
      }

      if (queryDto.releaseContainerId) {
        queryBuilder.andWhere(
          'song.releaseContainer.id = :releaseContainerId',
          {
            releaseContainerId: queryDto.releaseContainerId,
          },
        );
      }

      // Add sorting
      queryBuilder
        .orderBy('song.createdAt', 'DESC')
        .addOrderBy('song.title', 'ASC');

      // Execute query with pagination
      const [songs, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        statusCode: HttpStatus.OK,
        message: 'Songs retrieved successfully',
        data: {
          songs,
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to query songs: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve songs',
      };
    }
  }

  async queryReleaseContainers(
    queryDto: QueryReleaseContainerDto,
    user: User,
  ): Promise<
    ApiResponse<{
      containers: ReleaseContainer[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    try {
      const { page = 1, limit = 10 } = queryDto;
      const skip = (page - 1) * limit;

      const queryBuilder = this.releaseContainerRepository
        .createQueryBuilder('container')
        .leftJoinAndSelect('container.primaryArtist', 'primaryArtist')
        .leftJoinAndSelect(
          'container.featuredPlatformArtists',
          'featuredArtists',
        )
        .leftJoinAndSelect('container.featuredTempArtists', 'tempArtists')
        .leftJoinAndSelect('container.tracks', 'tracks')
        .where('container.uploadedBy = :userId', { userId: user.id });

      // Apply filters
      if (queryDto.search) {
        queryBuilder.andWhere(
          '(LOWER(container.title) LIKE LOWER(:search) OR LOWER(container.description) LIKE LOWER(:search))',
          { search: `%${queryDto.search}%` },
        );
      }

      if (queryDto.type) {
        queryBuilder.andWhere('container.type = :type', {
          type: queryDto.type,
        });
      }

      if (queryDto.status) {
        queryBuilder.andWhere('container.status = :status', {
          status: queryDto.status,
        });
      }

      if (queryDto.artistId) {
        queryBuilder.andWhere(
          '(container.primaryArtist.id = :artistId OR :artistId = ANY(container.featuredPlatformArtists))',
          { artistId: queryDto.artistId },
        );
      }

      // Add sorting
      queryBuilder
        .orderBy('container.createdAt', 'DESC')
        .addOrderBy('container.title', 'ASC');

      // Execute query with pagination
      const [containers, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        statusCode: HttpStatus.OK,
        message: 'Release containers retrieved successfully',
        data: {
          containers,
          total,
          page,
          limit,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to query release containers: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve release containers',
      };
    }
  }

  async getSongDetails(id: string, user: User): Promise<ApiResponse<Song>> {
    try {
      // First, try to find the song with basic relations
      const song = await this.songRepository.findOne({
        where: {
          id,
          uploadedById: user.id,
        },
        relations: {
          primaryArtist: true,
          featuredPlatformArtists: true,
          featuredTempArtists: true,
          releaseContainer: true,
        },
      });

      if (!song) {
        this.logger.warn(`Song not found - ID: ${id}, User: ${user.id}`);
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Song not found or unauthorized',
        };
      }

      // Get file paths
      const filePaths = await this.getFilePaths(song);

      // Get split sheet information if available
      const splitSheetInfo = await this.splitSheetService.getSplitSheetBySongId(
        song.id,
      );

      // Create response object with file paths and split sheet info
      const response = {
        ...song,
        coverArtPath: filePaths.coverArtPath,
        masterTrackPath: filePaths.masterTrackPath,
        mixVersions: filePaths.mixVersions,
        previewClip: filePaths.previewClip,
        musicVideo: filePaths.musicVideo,
        ...(splitSheetInfo && {
          splitSheetId: splitSheetInfo.splitSheetId,
          splitSheet: splitSheetInfo.splitSheet,
        }),
      };

      return {
        statusCode: HttpStatus.OK,
        message: 'Song details retrieved successfully',
        data: response,
      };
    } catch (error) {
      this.logger.error(`Failed to get song details - ID: ${id}`, {
        error: error.message,
        stackTrace: error.stack,
        userId: user.id,
      });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve song details',
      };
    }
  }

  async getReleaseContainerDetails(
    id: string,
    user: User,
  ): Promise<ApiResponse<ReleaseContainer>> {
    try {
      // First, try to find the container with basic relations
      const container = await this.releaseContainerRepository.findOne({
        where: {
          id,
          uploadedById: user.id,
        },
        relations: {
          primaryArtist: true,
          tracks: true,
          featuredPlatformArtists: true,
          featuredTempArtists: true,
        },
      });

      if (!container) {
        this.logger.warn(
          `Release container not found - ID: ${id}, User: ${user.id}`,
        );
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Release container not found or unauthorized',
        };
      }

      // Get file paths
      const filePaths = await this.getReleaseContainerFilePaths(
        container,
        user,
      );

      // Create response object with file paths
      const response = {
        ...container,
        coverArtPath: filePaths.coverArtPath,
      };

      return {
        statusCode: HttpStatus.OK,
        message: 'Release container details retrieved successfully',
        data: response,
      };
    } catch (error) {
      this.logger.error(`Failed to get release container details - ID: ${id}`, {
        error: error.message,
        stackTrace: error.stack,
        userId: user.id,
      });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve release container details',
      };
    }
  }

  async getReleaseContainersByArtist(
    artistId: string,
    user: User,
  ): Promise<ApiResponse<ReleaseContainer[]>> {
    try {
      // First verify the artist exists
      const artist = await this.artistRepository.findOne({
        where: { id: artistId },
      });

      if (!artist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Artist not found',
        };
      }

      // Find all release containers where the artist is the primary artist
      const containers = await this.releaseContainerRepository
        .createQueryBuilder('container')
        .leftJoinAndSelect('container.primaryArtist', 'primaryArtist')
        .leftJoinAndSelect(
          'container.featuredPlatformArtists',
          'featuredArtists',
        )
        .leftJoinAndSelect('container.featuredTempArtists', 'tempArtists')
        .leftJoinAndSelect('container.tracks', 'tracks')
        .where('primaryArtist.id = :artistId', { artistId })
        .getMany();

      // Get file paths for each container
      const containersWithPaths = await Promise.all(
        containers.map(async (container) => {
          const filePaths = await this.getReleaseContainerFilePaths(
            container,
            user,
          );
          return {
            ...container,
            coverArtPath: filePaths.coverArtPath,
          };
        }),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Artist release containers retrieved successfully',
        data: containersWithPaths,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get artist release containers - Artist ID: ${artistId}`,
        {
          error: error.message,
          stackTrace: error.stack,
          userId: user.id,
        },
      );

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve artist release containers',
      };
    }
  }

  async getReleaseContainersByUser(
    user: User,
  ): Promise<ApiResponse<ReleaseContainer[]>> {
    try {
      // Find all release containers uploaded by the user
      const containers = await this.releaseContainerRepository
        .createQueryBuilder('container')
        .leftJoinAndSelect('container.primaryArtist', 'primaryArtist')
        .leftJoinAndSelect(
          'container.featuredPlatformArtists',
          'featuredArtists',
        )
        .leftJoinAndSelect('container.featuredTempArtists', 'tempArtists')
        .leftJoinAndSelect('container.tracks', 'tracks')
        .where('container.uploadedById = :userId', { userId: user.id })
        .getMany();

      // Get file paths for each container
      const containersWithPaths = await Promise.all(
        containers.map(async (container) => {
          const filePaths = await this.getReleaseContainerFilePaths(
            container,
            user,
          );
          return {
            ...container,
            coverArtPath: filePaths.coverArtPath,
          };
        }),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'User release containers retrieved successfully',
        data: containersWithPaths,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user release containers - User ID: ${user.id}`,
        {
          error: error.message,
          stackTrace: error.stack,
          userId: user.id,
        },
      );

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve user release containers',
      };
    }
  }

  async getSongsByUser(user: User): Promise<ApiResponse<Song[]>> {
    try {
      // Find all songs uploaded by the user
      const songs = await this.songRepository
        .createQueryBuilder('song')
        .leftJoinAndSelect('song.primaryArtist', 'primaryArtist')
        .leftJoinAndSelect('song.featuredPlatformArtists', 'featuredArtists')
        .leftJoinAndSelect('song.featuredTempArtists', 'tempArtists')
        .leftJoinAndSelect('song.releaseContainer', 'releaseContainer')
        .where('song.uploadedById = :userId', { userId: user.id })
        .getMany();

      // Get file paths and split sheet info for each song
      const songsWithPaths = await Promise.all(
        songs.map(async (song) => {
          const filePaths = await this.getFilePaths(song);

          // Get split sheet information if available
          const splitSheetInfo =
            await this.splitSheetService.getSplitSheetBySongId(song.id);

          return {
            ...song,
            coverArtPath: filePaths.coverArtPath,
            masterTrackPath: filePaths.masterTrackPath,
            mixVersions: filePaths.mixVersions,
            previewClip: filePaths.previewClip,
            musicVideo: filePaths.musicVideo,
            ...(splitSheetInfo && {
              splitSheetId: splitSheetInfo.splitSheetId,
              splitSheet: splitSheetInfo.splitSheet,
            }),
          };
        }),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'User songs retrieved successfully',
        data: songsWithPaths,
      };
    } catch (error) {
      this.logger.error('Failed to get user songs', {
        error: error.message,
        stackTrace: error.stack,
        userId: user.id,
      });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve user songs',
      };
    }
  }

  private async getReleaseContainerFilePaths(
    container: ReleaseContainer,
    user: User,
  ): Promise<{
    coverArtPath?: string;
  }> {
    const result: any = {};

    // Get cover art path
    if (container.coverArtId) {
      const signedUrlResult = await this.storageService.getSignedUrl(
        container.coverArtId,
        user,
      );
      result.coverArtPath = signedUrlResult.data;
    }

    return result;
  }

  // Get File Paths
  // Added new function to get file paths for the song response

  private async getFilePaths(song: Song): Promise<{
    coverArtPath?: string;
    masterTrackPath?: string;
    mixVersions?: { fileId: string; versionLabel: string; path: string }[];
    previewClip?: {
      fileId: string;
      startTime: number;
      endTime: number;
      path: string;
    };
    musicVideo?: { url: string; thumbnailId: string; thumbnailPath: string };
  }> {
    const result: any = {};
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

    // Get cover art path
    if (song.coverArtId) {
      const coverArt = await this.imageFileRepository.findOne({
        where: { id: song.coverArtId },
      });
      if (coverArt) {
        result.coverArtPath = `${baseUrl}/storage/files/${coverArt.id}`;
      }
    }

    // Get master track path
    if (song.masterTrackId) {
      const masterTrack = await this.audioFileRepository.findOne({
        where: { id: song.masterTrackId },
      });
      if (masterTrack) {
        result.masterTrackPath = `${baseUrl}/storage/files/${masterTrack.id}`;
      }
    }

    // Get mix versions paths
    if (song.mixVersions?.length) {
      result.mixVersions = await Promise.all(
        song.mixVersions.map(async (mv) => {
          const mixVersion = await this.audioFileRepository.findOne({
            where: { id: mv.fileId },
          });
          return {
            ...mv,
            path: mixVersion ? `${baseUrl}/storage/files/${mixVersion.id}` : '',
          };
        }),
      );
    }

    // Get preview clip path
    if (song.previewClip?.fileId) {
      const previewClip = await this.audioFileRepository.findOne({
        where: { id: song.previewClip.fileId },
      });
      if (previewClip) {
        result.previewClip = {
          ...song.previewClip,
          path: `${baseUrl}/storage/files/${previewClip.id}`,
        };
      }
    }

    // Get music video thumbnail path
    if (song.musicVideo?.thumbnailId) {
      const thumbnail = await this.imageFileRepository.findOne({
        where: { id: song.musicVideo.thumbnailId },
      });
      if (thumbnail) {
        result.musicVideo = {
          ...song.musicVideo,
          thumbnailPath: `${baseUrl}/storage/files/${thumbnail.id}`,
        };
      }
    }

    return result;
  }

  async getArtistSongs(
    artistId: string,
    user: User,
  ): Promise<ApiResponse<Song[]>> {
    try {
      // First verify the artist exists
      const artist = await this.artistRepository.findOne({
        where: { id: artistId },
      });

      if (!artist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Artist not found',
        };
      }

      // Log the query parameters
      this.logger.debug(
        `Searching for songs where artist ${artistId} is primary artist`,
      );

      // Find all songs where the artist is the primary artist
      const songs = await this.songRepository
        .createQueryBuilder('song')
        .leftJoinAndSelect('song.primaryArtist', 'primaryArtist')
        .leftJoinAndSelect('song.featuredPlatformArtists', 'featuredArtists')
        .leftJoinAndSelect('song.featuredTempArtists', 'tempArtists')
        .leftJoinAndSelect('song.releaseContainer', 'releaseContainer')
        .where('primaryArtist.id = :artistId', { artistId })
        .getMany();

      // Log the number of songs found
      this.logger.debug(
        `Found ${songs.length} songs where artist ${artistId} is primary artist`,
      );

      if (songs.length === 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'No songs found where this artist is the primary artist',
          data: [],
        };
      }

      // Get file paths for each song
      const songsWithPaths = await Promise.all(
        songs.map(async (song) => {
          const filePaths = await this.getFilePaths(song);
          return {
            ...song,
            coverArtPath: filePaths.coverArtPath,
            masterTrackPath: filePaths.masterTrackPath,
            mixVersions: filePaths.mixVersions,
            previewClip: filePaths.previewClip,
            musicVideo: filePaths.musicVideo,
          };
        }),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Artist songs retrieved successfully',
        data: songsWithPaths,
      };
    } catch (error) {
      this.logger.error(`Failed to get artist songs - Artist ID: ${artistId}`, {
        error: error.message,
        stackTrace: error.stack,
        userId: user.id,
      });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve artist songs',
      };
    }
  }

  async deleteSong(id: string, user: User): Promise<ApiResponse> {
    try {
      const song = await this.songRepository.findOne({
        where: { id, uploadedBy: { id: user.id } },
        relations: ['releaseContainer'],
      });

      if (!song) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Song not found or unauthorized',
        };
      }

      // If song is part of a release container, update the container
      if (song.releaseContainer) {
        await this.releaseContainerRepository.update(
          { id: song.releaseContainer.id },
          { uploadedTracks: () => 'uploadedTracks - 1' },
        );
      }

      await this.songRepository.softRemove(song);

      return {
        statusCode: HttpStatus.OK,
        message: 'Song deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete song: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete song',
      };
    }
  }

  async deleteReleaseContainer(id: string, user: User): Promise<ApiResponse> {
    try {
      const container = await this.releaseContainerRepository.findOne({
        where: { id, uploadedBy: { id: user.id } },
        relations: ['tracks'],
      });

      if (!container) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Release container not found or unauthorized',
        };
      }

      // First delete all associated tracks
      if (container.tracks?.length > 0) {
        await this.songRepository.softRemove(container.tracks);
      }

      // Then delete the container
      await this.releaseContainerRepository.softRemove(container);

      return {
        statusCode: HttpStatus.OK,
        message: 'Release container and associated tracks deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete release container: ${error.message}`);
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete release container',
      };
    }
  }

  async getArtistDiscography(
    artistId: string,
    user: User,
  ): Promise<ApiResponse<DiscographyResponseDto>> {
    try {
      // First verify the artist exists
      const artist = await this.artistRepository.findOne({
        where: { id: artistId },
      });

      if (!artist) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Artist not found',
        };
      }

      // Get singles (only those not part of any release container)
      const singles = await this.songRepository
        .createQueryBuilder('song')
        .leftJoinAndSelect('song.primaryArtist', 'primaryArtist')
        .leftJoinAndSelect('song.featuredPlatformArtists', 'featuredArtists')
        .leftJoinAndSelect('song.featuredTempArtists', 'tempArtists')
        .leftJoinAndSelect('song.releaseContainer', 'releaseContainer')
        .where('primaryArtist.id = :artistId', { artistId })
        .andWhere('song.releaseType = :releaseType', {
          releaseType: ReleaseType.SINGLE,
        })
        .andWhere('song.releaseContainerId IS NULL')
        .orderBy('song.proposedReleaseDate', 'DESC')
        .getMany();

      // Get albums and EPs
      const releaseContainers = await this.releaseContainerRepository
        .createQueryBuilder('container')
        .leftJoinAndSelect('container.primaryArtist', 'primaryArtist')
        .leftJoinAndSelect('container.tracks', 'tracks')
        .leftJoinAndSelect(
          'tracks.featuredPlatformArtists',
          'trackFeaturedArtists',
        )
        .leftJoinAndSelect('tracks.featuredTempArtists', 'trackTempArtists')
        .where('primaryArtist.id = :artistId', { artistId })
        .orderBy('container.proposedReleaseDate', 'DESC')
        .getMany();

      // Separate albums and EPs
      const albums = releaseContainers.filter(
        (container) => container.type === ReleaseContainerType.ALBUM,
      );
      const eps = releaseContainers.filter(
        (container) => container.type === ReleaseContainerType.EP,
      );

      // Get complete song objects with file paths for singles
      const singlesWithUrls = await Promise.all(
        singles.map(async (song) => {
          const filePaths = await this.getFilePaths(song);
          // Get split sheet information if available
          const splitSheetInfo =
            await this.splitSheetService.getSplitSheetBySongId(song.id);

          return {
            ...song,
            coverArtPath: filePaths.coverArtPath,
            masterTrackPath: filePaths.masterTrackPath,
            mixVersions: filePaths.mixVersions?.map((mix) => ({
              versionLabel: mix.versionLabel,
              fileId: mix.fileId,
              path: mix.path,
            })),
            previewClip: filePaths.previewClip
              ? {
                  fileId: filePaths.previewClip.fileId,
                  startTime: filePaths.previewClip.startTime,
                  endTime: filePaths.previewClip.endTime,
                  path: filePaths.previewClip.path,
                }
              : undefined,
            musicVideo: filePaths.musicVideo
              ? {
                  url: filePaths.musicVideo.url,
                  thumbnailId: filePaths.musicVideo.thumbnailId,
                  thumbnailPath: filePaths.musicVideo.thumbnailPath,
                }
              : undefined,
            ...(splitSheetInfo && {
              splitSheetId: splitSheetInfo.splitSheetId,
              splitSheet: splitSheetInfo.splitSheet,
            }),
          };
        }),
      );

      // Get complete song objects with file paths for albums and EPs
      const albumsWithUrls = await Promise.all(
        albums.map(async (album) => {
          const filePaths = await this.getReleaseContainerFilePaths(
            album,
            user,
          );
          // Get complete song objects with file paths for each track
          const tracksWithUrls = await Promise.all(
            album.tracks.map(async (track) => {
              const trackFilePaths = await this.getFilePaths(track);
              // Get split sheet information if available
              const splitSheetInfo =
                await this.splitSheetService.getSplitSheetBySongId(track.id);

              return {
                ...track,
                coverArtPath: trackFilePaths.coverArtPath,
                masterTrackPath: trackFilePaths.masterTrackPath,
                mixVersions: trackFilePaths.mixVersions?.map((mix) => ({
                  versionLabel: mix.versionLabel,
                  fileId: mix.fileId,
                  path: mix.path,
                })),
                previewClip: trackFilePaths.previewClip
                  ? {
                      fileId: trackFilePaths.previewClip.fileId,
                      startTime: trackFilePaths.previewClip.startTime,
                      endTime: trackFilePaths.previewClip.endTime,
                      path: trackFilePaths.previewClip.path,
                    }
                  : undefined,
                musicVideo: trackFilePaths.musicVideo
                  ? {
                      url: trackFilePaths.musicVideo.url,
                      thumbnailId: trackFilePaths.musicVideo.thumbnailId,
                      thumbnailPath: trackFilePaths.musicVideo.thumbnailPath,
                    }
                  : undefined,
                ...(splitSheetInfo && {
                  splitSheetId: splitSheetInfo.splitSheetId,
                  splitSheet: splitSheetInfo.splitSheet,
                }),
              };
            }),
          );

          return {
            id: album.id,
            title: album.title,
            type: album.type,
            coverArtPath: filePaths.coverArtPath,
            releaseDate: album.proposedReleaseDate,
            status: album.status,
            totalTracks: album.totalTracks,
            tracks: tracksWithUrls,
          };
        }),
      );

      const epsWithUrls = await Promise.all(
        eps.map(async (ep) => {
          const filePaths = await this.getReleaseContainerFilePaths(ep, user);
          // Get complete song objects with file paths for each track
          const tracksWithUrls = await Promise.all(
            ep.tracks.map(async (track) => {
              const trackFilePaths = await this.getFilePaths(track);
              // Get split sheet information if available
              const splitSheetInfo =
                await this.splitSheetService.getSplitSheetBySongId(track.id);

              return {
                ...track,
                coverArtPath: trackFilePaths.coverArtPath,
                masterTrackPath: trackFilePaths.masterTrackPath,
                mixVersions: trackFilePaths.mixVersions?.map((mix) => ({
                  versionLabel: mix.versionLabel,
                  fileId: mix.fileId,
                  path: mix.path,
                })),
                previewClip: trackFilePaths.previewClip
                  ? {
                      fileId: trackFilePaths.previewClip.fileId,
                      startTime: trackFilePaths.previewClip.startTime,
                      endTime: trackFilePaths.previewClip.endTime,
                      path: trackFilePaths.previewClip.path,
                    }
                  : undefined,
                musicVideo: trackFilePaths.musicVideo
                  ? {
                      url: trackFilePaths.musicVideo.url,
                      thumbnailId: trackFilePaths.musicVideo.thumbnailId,
                      thumbnailPath: trackFilePaths.musicVideo.thumbnailPath,
                    }
                  : undefined,
                ...(splitSheetInfo && {
                  splitSheetId: splitSheetInfo.splitSheetId,
                  splitSheet: splitSheetInfo.splitSheet,
                }),
              };
            }),
          );

          return {
            id: ep.id,
            title: ep.title,
            type: ep.type,
            coverArtPath: filePaths.coverArtPath,
            releaseDate: ep.proposedReleaseDate,
            status: ep.status,
            totalTracks: ep.totalTracks,
            tracks: tracksWithUrls,
          };
        }),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Artist discography retrieved successfully',
        data: {
          singles: singlesWithUrls,
          albums: albumsWithUrls,
          eps: epsWithUrls,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get artist discography - Artist ID: ${artistId}`,
        {
          error: error.message,
          stackTrace: error.stack,
          userId: user.id,
        },
      );

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to retrieve artist discography',
      };
    }
  }
}
