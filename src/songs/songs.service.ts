// // src/songs/services/song.service.ts
// import {
//   Injectable,
//   Logger,
//   NotFoundException,
//   BadRequestException,
//   ConflictException,
//   Inject,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Song, SongStatus, SongType } from './entities/song.entity';
// import { CreateSongDto, UpdateSongDto, QuerySongDto } from './dtos/song.dto';
// import {
//   RoyaltySplits,
//   SongValidationError,
// } from './interfaces/royalty-split.interface';

// import {
//   ISongService,
//   AudioProcessingResult,
//   ImageProcessingResult,
//   VideoProcessingResult,
//   ProcessingStatus,
//   SongValidationResult,
//   PaginatedSongs,
//   IFileProcessor,
//   IMetadataService,
//   IDistributionService,
// } from './interfaces/song-service.interface';

// import { Artist } from 'src/artists/entities/artist.entity';
// import { StorageService } from 'src/storage/services/storage.service';

// @Injectable()
// export class SongService implements ISongService {
//   private readonly logger = new Logger(SongService.name);

//   constructor(
//     @InjectRepository(Song)
//     private readonly songRepository: Repository<Song>,
//     @InjectRepository(Artist)
//     private readonly artistRepository: Repository<Artist>,
//     @Inject('IFileProcessor')
//     private readonly fileProcessor: IFileProcessor,
//     @Inject('IMetadataService')
//     private readonly metadataService: IMetadataService,
//     @Inject('IDistributionService')
//     private readonly distributionService: IDistributionService,
//     @Inject('StorageService')
//     private readonly storageService: StorageService,
//   ) {}

//   async createSong(
//     userId: string,
//     createSongDto: CreateSongDto,
//   ): Promise<Song> {
//     this.logger.log(`Creating new song for user ${userId}`);

//     try {
//       // Verify artist exists and user has permission
//       const artist = await this.artistRepository.findOne({
//         where: { user: { id: userId } },
//       });

//       if (!artist) {
//         throw new BadRequestException(
//           'Artist profile required to create songs',
//         );
//       }

//       // Validate ISRC if provided
//       if (createSongDto.isrc) {
//         const isValidISRC = await this.metadataService.validateISRC(
//           createSongDto.isrc,
//         );
//         if (!isValidISRC) {
//           throw new BadRequestException('Invalid ISRC code');
//         }
//       }

//       // Create song entity
//       const song = this.songRepository.create({
//         ...createSongDto,
//         artist,
//         status: SongStatus.DRAFT,
//       });

//       // Validate royalty splits
//       const totalSplits = this.calculateTotalSplits(
//         createSongDto.royaltySplits,
//       );
//       if (totalSplits !== 100) {
//         throw new BadRequestException('Royalty splits must total 100%');
//       }

//       const savedSong = await this.songRepository.save(song);

//       this.logger.log(`Successfully created song with ID ${savedSong.id}`);
//       return savedSong;
//     } catch (error) {
//       this.logger.error(`Failed to create song: ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   async updateSong(
//     userId: string,
//     songId: string,
//     updateSongDto: UpdateSongDto,
//   ): Promise<Song> {
//     this.logger.log(`Updating song ${songId} for user ${userId}`);

//     const song = await this.songRepository.findOne({
//       where: { id: songId, artist: { user: { id: userId } } },
//       relations: ['artist', 'artist.user'],
//     });

//     if (!song) {
//       throw new NotFoundException('Song not found or access denied');
//     }

//     // Prevent updates to distributed songs
//     if (song.status === SongStatus.DISTRIBUTED) {
//       throw new ConflictException('Cannot update a distributed song');
//     }

//     try {
//       // Validate royalty splits if updating
//       if (updateSongDto.royaltySplits) {
//         const totalSplits = this.calculateTotalSplits(
//           updateSongDto.royaltySplits,
//         );
//         if (totalSplits !== 100) {
//           throw new BadRequestException('Royalty splits must total 100%');
//         }
//       }

//       // Update song entity
//       Object.assign(song, updateSongDto);
//       const updatedSong = await this.songRepository.save(song);

//       this.logger.log(`Successfully updated song ${songId}`);
//       return updatedSong;
//     } catch (error) {
//       this.logger.error(
//         `Failed to update song ${songId}: ${error.message}`,
//         error.stack,
//       );
//       throw error;
//     }
//   }

//   async deleteSong(userId: string, songId: string): Promise<void> {
//     this.logger.log(`Deleting song ${songId} for user ${userId}`);

//     const song = await this.songRepository.findOne({
//       where: { id: songId, artist: { user: { id: userId } } },
//     });

//     if (!song) {
//       throw new NotFoundException('Song not found or access denied');
//     }

//     // Prevent deletion of distributed songs
//     if (song.status === SongStatus.DISTRIBUTED) {
//       throw new ConflictException('Cannot delete a distributed song');
//     }

//     try {
//       // Delete associated files
//       if (song.audioFiles?.originalFile) {
//         await this.storageService.delete(song.audioFiles.originalFile);
//       }
//       if (song.coverImage) {
//         await this.storageService.delete(song.coverImage);
//       }

//       await this.songRepository.softRemove(song);
//       this.logger.log(`Successfully deleted song ${songId}`);
//     } catch (error) {
//       this.logger.error(
//         `Failed to delete song ${songId}: ${error.message}`,
//         error.stack,
//       );
//       throw error;
//     }
//   }

//   async getSong(songId: string): Promise<Song> {
//     const song = await this.songRepository.findOne({
//       where: { id: songId },
//       relations: ['artist', 'lyrics'],
//     });

//     if (!song) {
//       throw new NotFoundException('Song not found');
//     }

//     return song;
//   }

//   async querySongs(queryDto: QuerySongDto): Promise<PaginatedSongs> {
//     const { status, artistId, search, genre, page = 1, limit = 10 } = queryDto;
//     const skip = (page - 1) * limit;

//     try {
//       const queryBuilder = this.songRepository
//         .createQueryBuilder('song')
//         .leftJoinAndSelect('song.artist', 'artist')
//         .skip(skip)
//         .take(limit);

//       if (status) {
//         queryBuilder.andWhere('song.status = :status', { status });
//       }

//       if (artistId) {
//         queryBuilder.andWhere('artist.id = :artistId', { artistId });
//       }

//       // if (genre) {
//       //   queryBuilder.andWhere('song.genres @> ARRAY[:genre]', { genre });
//       // }
//       if (genre) {
//         queryBuilder.andWhere('song.genres @> ARRAY[:genre]::text[]', {
//           genre,
//         });
//       }

//       if (search) {
//         queryBuilder.andWhere(
//           '(LOWER(song.title) LIKE LOWER(:search) OR LOWER(artist.stageName) LIKE LOWER(:search))',
//           { search: `%${search}%` },
//         );
//       }

//       const [songs, total] = await queryBuilder.getManyAndCount();

//       return {
//         items: songs,
//         total,
//         page,
//         totalPages: Math.ceil(total / limit),
//         hasMore: page * limit < total,
//       };
//     } catch (error) {
//       this.logger.error(`Failed to query songs: ${error.message}`, error.stack);
//       throw error;
//     }
//   }

//   async uploadAudio(
//     songId: string,
//     file: Express.Multer.File,
//     version?: string,
//   ): Promise<AudioProcessingResult> {
//     const song = await this.getSong(songId);

//     try {
//       // Process audio file
//       const processResult = await this.fileProcessor.processAudio(file);
//       if (!processResult.success) {
//         throw new BadRequestException(
//           processResult.error || 'Audio processing failed',
//         );
//       }

//       // Upload to storage
//       const { key } = await this.storageService.upload(file, {
//         type: 'audio',
//         metadata: {
//           songId,
//           version,
//           ...processResult,
//         },
//       });

//       // Update song entity
//       if (version) {
//         song.audioFiles.mixVersions = [
//           ...(song.audioFiles.mixVersions || []),
//           { version, file: key },
//         ];
//       } else {
//         song.audioFiles = { ...song.audioFiles, originalFile: key };
//       }

//       await this.songRepository.save(song);
//       return processResult;
//     } catch (error) {
//       this.logger.error(
//         `Failed to upload audio for song ${songId}: ${error.message}`,
//         error.stack,
//       );
//       throw error;
//     }
//   }

//   async uploadArtwork(
//     songId: string,
//     file: Express.Multer.File,
//   ): Promise<ImageProcessingResult> {
//     const song = await this.getSong(songId);

//     try {
//       // Process image file
//       const processResult = await this.fileProcessor.processImage(file);
//       if (!processResult.success) {
//         throw new BadRequestException(
//           processResult.error || 'Image processing failed',
//         );
//       }

//       // Upload to storage
//       const { key } = await this.storageService.upload(file, {
//         type: 'image',
//         metadata: {
//           songId,
//           ...processResult,
//         },
//       });

//       // Update song entity
//       song.coverImage = key;
//       await this.songRepository.save(song);

//       return processResult;
//     } catch (error) {
//       this.logger.error(
//         `Failed to upload artwork for song ${songId}: ${error.message}`,
//         error.stack,
//       );
//       throw error;
//     }
//   }

//   async uploadVideo(
//     songId: string,
//     file: Express.Multer.File,
//   ): Promise<VideoProcessingResult> {
//     const song = await this.getSong(songId);

//     try {
//       // Process video file
//       const processResult = await this.fileProcessor.processVideo(file);
//       if (!processResult.success) {
//         throw new BadRequestException(
//           processResult.error || 'Video processing failed',
//         );
//       }

//       // Upload to storage
//       const { key } = await this.storageService.upload(file, {
//         type: 'video',
//         metadata: {
//           songId,
//           ...processResult,
//         },
//       });

//       // Update song entity
//       song.musicVideo = {
//         url: key,
//         thumbnail: processResult.thumbnail,
//       };
//       await this.songRepository.save(song);

//       return processResult;
//     } catch (error) {
//       this.logger.error(
//         `Failed to upload video for song ${songId}: ${error.message}`,
//         error.stack,
//       );
//       throw error;
//     }
//   }

//   async updateStatus(
//     songId: string,
//     newStatus: SongStatus,
//     notes?: string,
//   ): Promise<Song> {
//     const song = await this.getSong(songId);

//     try {
//       // Validate status transition
//       await this.validateStatusTransition(song.status, newStatus);

//       // Update status
//       song.status = newStatus;
//       if (notes) {
//         song.reviewNotes = notes;
//       }

//       // Perform status-specific actions
//       switch (newStatus) {
//         case SongStatus.IN_REVIEW:
//           await this.validateSong(songId);
//           break;
//         case SongStatus.APPROVED:
//           await this.metadataService.enrichMetadata(songId);
//           break;
//         case SongStatus.READY_FOR_DISTRIBUTION:
//           await this.distributionService.prepareForDistribution(songId);
//           break;
//       }

//       return await this.songRepository.save(song);
//     } catch (error) {
//       this.logger.error(
//         `Failed to update status for song ${songId}: ${error.message}`,
//         error.stack,
//       );
//       throw error;
//     }
//   }

//   async getProcessingStatus(songId: string): Promise<ProcessingStatus> {
//     const song = await this.getSong(songId);

//     // Return current processing status for all components
//     return {
//       audio: song.audioFiles
//         ? {
//             status: 'completed',
//             result: {
//               success: true,
//               // Add audio processing details
//             },
//           }
//         : undefined,
//       image: song.coverImage
//         ? {
//             status: 'completed',
//             result: {
//               success: true,
//               // Add image processing details
//             },
//           }
//         : undefined,
//       video: song.musicVideo
//         ? {
//             status: 'completed',
//             result: {
//               success: true,
//               // Add video processing details
//             },
//           }
//         : undefined,
//     };
//   }

//   private async validateStatusTransition(
//     currentStatus: SongStatus,
//     newStatus: SongStatus,
//   ): Promise<void> {
//     const validTransitions: Record<SongStatus, SongStatus[]> = {
//       [SongStatus.DRAFT]: [SongStatus.PENDING_REVIEW],
//       [SongStatus.PENDING_REVIEW]: [SongStatus.IN_REVIEW, SongStatus.DRAFT],
//       [SongStatus.IN_REVIEW]: [
//         SongStatus.APPROVED,
//         SongStatus.REJECTED,
//         SongStatus.DRAFT,
//       ],
//       [SongStatus.APPROVED]: [SongStatus.PROCESSING, SongStatus.DRAFT],
//       [SongStatus.REJECTED]: [SongStatus.DRAFT],
//       [SongStatus.PROCESSING]: [
//         SongStatus.READY_FOR_DISTRIBUTION,
//         SongStatus.DRAFT,
//       ],
//       [SongStatus.READY_FOR_DISTRIBUTION]: [
//         SongStatus.DISTRIBUTED,
//         SongStatus.DRAFT,
//       ],
//       [SongStatus.DISTRIBUTED]: [],
//     };

//     if (!validTransitions[currentStatus].includes(newStatus)) {
//       throw new BadRequestException(
//         `Invalid status transition from ${currentStatus} to ${newStatus}`,
//       );
//     }
//   }

//   /**
//    * Calculates the total royalty splits ensuring that the sum equals 100%.
//    * @param splits RoyaltySplits object containing all share details.
//    * @returns The total sum of all royalty splits.
//    * @throws BadRequestException if validations fail.
//    */
//   private calculateTotalSplits(splits: RoyaltySplits): number {
//     this.validateSplits(splits);

//     const contributorTotal = this.sumShares(splits.contributorShares);
//     const writerTotal = this.sumShares(splits.writerShares);
//     const labelShare = splits.labelShare || 0;

//     const totalSplits =
//       splits.artistShare +
//       contributorTotal +
//       writerTotal +
//       labelShare +
//       splits.serviceShare;

//     // Handle floating-point precision by rounding to two decimal places
//     const totalSplitsRounded = parseFloat(totalSplits.toFixed(2));

//     if (totalSplitsRounded !== 100) {
//       throw new BadRequestException(
//         `Total royalty splits must equal 100%. Current total: ${totalSplitsRounded}%.`,
//       );
//     }

//     return totalSplitsRounded;
//   }

//   /**
//    * Sums up the share percentages from an array of shares.
//    * @param shares Array of shares (ContributorShare or WriterShare).
//    * @returns The total sum of shares.
//    */
//   private sumShares(shares: { share: number }[]): number {
//     return shares.reduce((sum, share) => sum + share.share, 0);
//   }

//   /**
//    * Validates the RoyaltySplits object to ensure all shares are within valid ranges.
//    * @param splits RoyaltySplits object to validate.
//    * @throws BadRequestException if any validation fails.
//    */
//   private validateSplits(splits: RoyaltySplits): void {
//     const errors: SongValidationError[] = [];

//     // Validate artistShare
//     if (!this.isValidShare(splits.artistShare)) {
//       errors.push({
//         field: 'artistShare',
//         message: 'Artist share must be greater than 0 and at most 100.',
//       });
//     }

//     // Validate serviceShare
//     if (!this.isValidShare(splits.serviceShare)) {
//       errors.push({
//         field: 'serviceShare',
//         message: 'Service share must be greater than 0 and at most 100.',
//       });
//     }

//     // Validate labelShare if provided
//     if (
//       splits.labelShare !== undefined &&
//       !this.isValidShare(splits.labelShare)
//     ) {
//       errors.push({
//         field: 'labelShare',
//         message: 'Label share must be greater than 0 and at most 100.',
//       });
//     }

//     // Validate contributorShares
//     if (!splits.contributorShares || splits.contributorShares.length === 0) {
//       errors.push({
//         field: 'contributorShares',
//         message: 'At least one contributor share is required.',
//       });
//     } else {
//       splits.contributorShares.forEach((contributor, index) => {
//         if (!this.isValidShare(contributor.share)) {
//           errors.push({
//             field: `contributorShares[${index}].share`,
//             message: `Contributor share must be greater than 0 and at most 100. Found: ${contributor.share}%.`,
//           });
//         }
//       });
//     }

//     // Validate writerShares
//     if (!splits.writerShares || splits.writerShares.length === 0) {
//       errors.push({
//         field: 'writerShares',
//         message: 'At least one writer share is required.',
//       });
//     } else {
//       splits.writerShares.forEach((writer, index) => {
//         if (!this.isValidShare(writer.share)) {
//           errors.push({
//             field: `writerShares[${index}].share`,
//             message: `Writer share must be greater than 0 and at most 100. Found: ${writer.share}%.`,
//           });
//         }
//       });
//     }

//     if (errors.length > 0) {
//       throw new BadRequestException({
//         message: 'Royalty splits validation failed.',
//         errors,
//       });
//     }
//   }

//   /**
//    * Checks if a share percentage is valid (greater than 0 and at most 100).
//    * @param share The share percentage to validate.
//    * @returns True if valid, false otherwise.
//    */
//   private isValidShare(share: number): boolean {
//     return typeof share === 'number' && share > 0 && share <= 100;
//   }

//   // private calculateTotalSplits(splits: any): number {
//   //   const {
//   //     artistShare,
//   //     contributorShares,
//   //     writerShares,
//   //     labelShare = 0,
//   //     serviceShare,
//   //   } = splits;

//   //   // Validate individual shares
//   //   if (artistShare < 0 || artistShare > 100) {
//   //     throw new BadRequestException('Artist share must be between 0 and 100.');
//   //   }

//   //   contributorShares.forEach((contributor) => {
//   //     if (contributor.share < 0 || contributor.share > 100) {
//   //       throw new BadRequestException(
//   //         `Contributor ${contributor.contributorId} share must be between 0 and 100.`,
//   //       );
//   //     }
//   //   });

//   //   writerShares.forEach((writer) => {
//   //     if (writer.share < 0 || writer.share > 100) {
//   //       throw new BadRequestException(
//   //         `Writer ${writer.writerId} share must be between 0 and 100.`,
//   //       );
//   //     }
//   //   });

//   //   if (serviceShare < 0 || serviceShare > 100) {
//   //     throw new BadRequestException('Service share must be between 0 and 100.');
//   //   }

//   //   const contributorTotal = contributorShares.reduce(
//   //     (sum: number, share: any) => sum + share.share,
//   //     0,
//   //   );
//   //   const writerTotal = writerShares.reduce(
//   //     (sum: number, share: any) => sum + share.share,
//   //     0,
//   //   );

//   //   return (
//   //     artistShare + contributorTotal + writerTotal + labelShare + serviceShare
//   //   );
//   // }

//   async validateSong(songId: string): Promise<SongValidationResult> {
//     const song = await this.getSong(songId);
//     const errors = [];

//     // Validate required fields
//     if (!song.audioFiles?.originalFile) {
//       errors.push({
//         field: 'audioFiles',
//         message: 'Original audio file is required',
//       });
//     }
//     if (!song.coverImage) {
//       errors.push({ field: 'coverImage', message: 'Cover image is required' });
//     }

//     // Validate metadata
//     const metadataValidation =
//       await this.metadataService.validateMetadata(songId);
//     if (!metadataValidation.isValid) {
//       errors.push(...(metadataValidation.errors || []));
//     }
//   }
//   // src/songs/services/song.service.ts (continued)
//   async validateRoyaltySplits(songId: string): Promise<SongValidationResult> {
//     const song = await this.getSong(songId);
//     const errors = [];

//     try {
//       const { royaltySplits } = song;
//       const totalSplits = this.calculateTotalSplits(royaltySplits);

//       if (totalSplits !== 100) {
//         errors.push({
//           field: 'royaltySplits',
//           message: `Total splits must equal 100%. Current total: ${totalSplits}%`,
//         });
//       }

//       // Validate contributor shares
//       for (const contributorShare of royaltySplits.contributorShares) {
//         if (contributorShare.share < 0 || contributorShare.share > 100) {
//           errors.push({
//             field: 'contributorShares',
//             message: `Invalid share percentage for contributor ${contributorShare.contributorId}`,
//           });
//         }
//       }

//       // Validate writer shares
//       for (const writerShare of royaltySplits.writerShares) {
//         if (writerShare.share < 0 || writerShare.share > 100) {
//           errors.push({
//             field: 'writerShares',
//             message: `Invalid share percentage for writer ${writerShare.writerId}`,
//           });
//         }
//       }

//       return {
//         isValid: errors.length === 0,
//         errors: errors.length > 0 ? errors : undefined,
//       };
//     } catch (error) {
//       this.logger.error(
//         `Failed to validate royalty splits for song ${songId}: ${error.message}`,
//       );
//       throw error;
//     }
//   }

//   async scheduleRelease(songId: string, releaseDate: Date): Promise<Song> {
//     const song = await this.getSong(songId);

//     try {
//       // Validate release date
//       if (releaseDate <= new Date()) {
//         throw new BadRequestException('Release date must be in the future');
//       }

//       // Validate song status
//       if (song.status !== SongStatus.APPROVED) {
//         throw new BadRequestException(
//           'Song must be approved before scheduling release',
//         );
//       }

//       // Update song with release information
//       song.proposedReleaseDate = releaseDate;
//       song.status = SongStatus.READY_FOR_DISTRIBUTION;

//       // If it's a pre-order release
//       if (releaseDate.getTime() - Date.now() > 7 * 24 * 60 * 60 * 1000) {
//         // More than 7 days
//         song.isPreOrder = true;
//         song.preOrderDate = new Date(
//           releaseDate.getTime() - 7 * 24 * 60 * 60 * 1000,
//         ); // 7 days before release
//       }

//       const updatedSong = await this.songRepository.save(song);

//       // Prepare for distribution
//       await this.distributionService.prepareForDistribution(songId);

//       return updatedSong;
//     } catch (error) {
//       this.logger.error(
//         `Failed to schedule release for song ${songId}: ${error.message}`,
//       );
//       throw error;
//     }
//   }

//   async submitForReview(songId: string): Promise<Song> {
//     const song = await this.getSong(songId);

//     try {
//       // Validate song is complete
//       const validationResult = await this.validateSong(songId);
//       if (!validationResult.isValid) {
//         throw new BadRequestException({
//           message: 'Song validation failed',
//           errors: validationResult.errors,
//         });
//       }

//       // Update status to pending review
//       song.status = SongStatus.PENDING_REVIEW;
//       return await this.songRepository.save(song);
//     } catch (error) {
//       this.logger.error(
//         `Failed to submit song ${songId} for review: ${error.message}`,
//       );
//       throw error;
//     }
//   }

//   async getUserDrafts(userId: string): Promise<Song[]> {
//     try {
//       return await this.songRepository.find({
//         where: {
//           status: SongStatus.DRAFT,
//           artist: { user: { id: userId } },
//         },
//         relations: ['artist'],
//       });
//     } catch (error) {
//       this.logger.error(
//         `Failed to get drafts for user ${userId}: ${error.message}`,
//       );
//       throw error;
//     }
//   }

//   async getPendingReviews(): Promise<Song[]> {
//     try {
//       return await this.songRepository.find({
//         where: { status: SongStatus.PENDING_REVIEW },
//         relations: ['artist'],
//         order: { updatedAt: 'ASC' },
//       });
//     } catch (error) {
//       this.logger.error(`Failed to get pending reviews: ${error.message}`);
//       throw error;
//     }
//   }

//   async getScheduledReleases(): Promise<Song[]> {
//     try {
//       return await this.songRepository.find({
//         where: { status: SongStatus.READY_FOR_DISTRIBUTION },
//         relations: ['artist'],
//         order: { proposedReleaseDate: 'ASC' },
//       });
//     } catch (error) {
//       this.logger.error(`Failed to get scheduled releases: ${error.message}`);
//       throw error;
//     }
//   }

//   // Private helper methods
//   private async validateFileRequirements(
//     song: Song,
//   ): Promise<SongValidationResult> {
//     const errors = [];

//     // Check audio file
//     if (!song.audioFiles?.originalFile) {
//       errors.push({
//         field: 'audioFiles',
//         message: 'Original audio file is required',
//       });
//     }

//     // Check cover image
//     if (!song.coverImage) {
//       errors.push({
//         field: 'coverImage',
//         message: 'Cover image is required',
//       });
//     }

//     // Explicit content requirements
//     if (song.songType === SongType.EXPLICIT) {
//       // Additional validation for explicit content
//       if (!song.audioFiles?.mixVersions?.some((v) => v.version === 'clean')) {
//         errors.push({
//           field: 'audioFiles',
//           message: 'Clean version required for explicit content',
//         });
//       }
//     }

//     return {
//       isValid: errors.length === 0,
//       errors: errors.length > 0 ? errors : undefined,
//     };
//   }

//   private async validateMetadataRequirements(
//     song: Song,
//   ): Promise<SongValidationResult> {
//     const errors = [];

//     // Required metadata fields
//     const requiredFields = [
//       'title',
//       'recordingYear',
//       'releaseLanguage',
//       'genres',
//     ];

//     for (const field of requiredFields) {
//       if (!song[field]) {
//         errors.push({
//           field,
//           message: `${field} is required`,
//         });
//       }
//     }

//     // Validate genres
//     if (song.genres && song.genres.length === 0) {
//       errors.push({
//         field: 'genres',
//         message: 'At least one genre must be specified',
//       });
//     }

//     // Validate release info
//     if (song.status === SongStatus.READY_FOR_DISTRIBUTION) {
//       if (!song.proposedReleaseDate) {
//         errors.push({
//           field: 'proposedReleaseDate',
//           message: 'Release date is required for distribution',
//         });
//       }

//       if (!song.targetStores || song.targetStores.length === 0) {
//         errors.push({
//           field: 'targetStores',
//           message: 'At least one target store must be specified',
//         });
//       }

//       if (!song.targetCountries || song.targetCountries.length === 0) {
//         errors.push({
//           field: 'targetCountries',
//           message: 'At least one target country must be specified',
//         });
//       }
//     }

//     return {
//       isValid: errors.length === 0,
//       errors: errors.length > 0 ? errors : undefined,
//     };
//   }
// }
