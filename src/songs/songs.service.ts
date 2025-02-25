// src/songs/songs.service.ts
import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song, SongStatus } from './entities/song.entity';
import {
  ReleaseContainer,
  ReleaseContainerStatus,
  // ReleaseContainerType,ReleaseType,
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
} from './dtos/song.dto';
import { AudioFile } from 'src/storage/entities/audio-file.entity';
import { ImageFile } from 'src/storage/entities/image-file.entity';
import { VideoFile } from 'src/storage/entities/video-file.entity';

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

      // -- previewClip
      if (createDto.previewClip && createDto.previewClip.fileId) {
        const previewClipError = await this.checkFileOwnershipOrExistence(
          createDto.previewClip.fileId,
          user,
          'previewClip.fileId',
        );
        if (previewClipError) return previewClipError;
      }

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

      //TODO: Fix this collaborator part soon

      // If song exists, load collaborators separately
      // const songWithCollaborators = await this.songRepository.findOne({
      //   where: { id: song.id },
      //   relations: {
      //     songCollaborators: {
      //       collaborator: true,
      //     },
      //   },
      // });

      // // Merge the collaborators into the original song object
      // if (songWithCollaborators?.songCollaborators) {
      //   song.songCollaborators = songWithCollaborators.songCollaborators;
      // }

      return {
        statusCode: HttpStatus.OK,
        message: 'Song details retrieved successfully',
        data: song,
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
      //TODO: Fix on returning the collaborators later

      // // If container exists, load collaborators separately
      // if (container.tracks?.length) {
      //   const tracksWithCollaborators = await Promise.all(
      //     container.tracks.map(async (track) => {
      //       const trackWithCollabs = await this.songRepository.findOne({
      //         where: { id: track.id },
      //         relations: {
      //           songCollaborators: {
      //             collaborator: true,
      //           },
      //         },
      //       });
      //       return trackWithCollabs;
      //     }),
      //   );

      //   container.tracks = tracksWithCollaborators;
      // }

      return {
        statusCode: HttpStatus.OK,
        message: 'Release container details retrieved successfully',
        data: container,
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
}
