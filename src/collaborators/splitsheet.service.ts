/**************************ADDITION OF NEW CODE TO TEST */
import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  //   ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SplitSheet, SplitSheetStatus } from './entities/splitsheet.entity';
import {
  SplitSheetEntry,
  SplitEntryStatus,
} from './entities/splitsheetEntry.entity';
import {
  CreateSplitSheetDto,
  ClaimSplitEntryDto,
  UpdateSplitSheetDto,
} from './dto/collaborator.dto';
import { Decimal } from 'decimal.js';
import { Song } from 'src/songs/entities/song.entity';
import { User } from 'src/users/user.entity';
import { EmailService } from 'src/auth/services/email.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@Injectable()
export class SplitSheetService {
  private readonly logger: winston.Logger;
  private readonly errorLogPath: string;
  private readonly encryptionKey: Buffer;
  private readonly encryptionIv: Buffer;

  constructor(
    @InjectRepository(SplitSheet)
    private readonly splitSheetRepository: Repository<SplitSheet>,
    @InjectRepository(SplitSheetEntry)
    private readonly splitEntryRepository: Repository<SplitSheetEntry>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    // Create logs directory if it doesn't exist
    this.errorLogPath = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.errorLogPath)) {
      fs.mkdirSync(this.errorLogPath, { recursive: true });
    }

    // Initialize Winston logger
    this.logger = winston.createLogger({
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(this.errorLogPath, 'split-sheet-errors.log'),
        }),
        new winston.transports.Console(),
      ],
    });

    // Initialize encryption for tokens (if needed for additional security)
    const encryptionSecret =
      this.configService.get<string>('ENCRYPTION_SECRET') ||
      'default-secret-key-change-in-production';
    this.encryptionKey = crypto.scryptSync(encryptionSecret, 'salt', 32);
    this.encryptionIv = Buffer.alloc(16, 0);
  }
  serviceChargePercentage = 15;
  //************************************* */
  //Begining of new splitsheet create function
  //************************************* */
  async createSplitSheet(
    createSplitSheetDto: CreateSplitSheetDto,
    userId: string,
  ): Promise<ApiResponse<SplitSheet>> {
    try {
      const { songId, entries } = createSplitSheetDto;

      // Check if a split sheet already exists for the song
      const existingSplitSheet = await this.splitSheetRepository.findOne({
        where: { song: { id: songId } },
      });

      if (existingSplitSheet) {
        this.logError('Split sheet already exists', { songId });
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'A split sheet already exists for this song. Please update the existing split sheet.',
        };
      }

      // Find the song with uploadedBy relationship
      const song = await this.songRepository.findOne({
        where: { id: songId },
        relations: ['uploadedBy'],
      });

      if (!song) {
        this.logError('Song not found', { songId });
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Song with ID ${songId} not found.`,
        };
      }

      // Check if the current user is the owner of the song or primary artist
      const isSongOwner = song.uploadedBy.id === userId;
      const isPrimaryArtist = song.primaryArtist?.user?.id === userId;

      if (!isSongOwner && !isPrimaryArtist) {
        this.logError('Unauthorized split sheet creation', { songId, userId });
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            'You are not authorized to create a split sheet for this song. Only the song owner or primary artist can create split sheets.',
        };
      }

      // Get the service charge percentage from the configuration
      //   const serviceChargePercentage = this.configService.get<number>(
      //     'splits.serviceChargePercentage',
      //   );

      const serviceChargePercentage = 15;

      if (!serviceChargePercentage) {
        this.logError('Service charge percentage not configured');
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Service charge percentage not configured.',
        };
      }

      // Validate the split entries using enhanced validation
      const validation = this.validateEntriesEnhanced(
        entries,
        serviceChargePercentage,
      );
      if (!validation.isValid) {
        this.logError('Enhanced split entry validation failed', {
          errors: validation.errors,
          entries,
        });
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid entries: ${validation.errors.join('; ')}`,
        };
      }

      // Calculate total percentage to ensure it's valid
      const totalPercentage = entries.reduce(
        (sum, entry) => sum + new Decimal(entry.percentage).toNumber(),
        0,
      );

      // Add platform fee
      const platformShare = serviceChargePercentage;

      // Validate that total percentages (including platform fee) equals 100
      if (Math.abs(totalPercentage + platformShare - 100) > 0.01) {
        this.logError('Total percentage does not equal 100%', {
          totalPercentage,
          platformShare,
        });
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Total percentage must equal exactly 100%. Current total: ${(totalPercentage + platformShare).toFixed(2)}%`,
        };
      }

      // Check for duplicate email entries
      const emailsSet = new Set<string>();
      for (const entry of entries) {
        if (emailsSet.has(entry.recipientEmail)) {
          this.logError('Duplicate recipient email', {
            email: entry.recipientEmail,
          });
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Duplicate recipient email found: ${entry.recipientEmail}`,
          };
        }
        emailsSet.add(entry.recipientEmail);
      }

      // Create a new split sheet entity and associate it with the song
      const splitSheet = this.splitSheetRepository.create({
        song,
        lastModifiedBy: userId,
      });

      // Save the split sheet first to get an ID
      let savedSplitSheet;
      try {
        savedSplitSheet = await this.splitSheetRepository.save(splitSheet);
      } catch (dbError) {
        this.logError('Failed to create split sheet', { error: dbError });
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to create split sheet: ${dbError.message}`,
        };
      }

      // Create and save entries
      try {
        // Create split sheet entries for each collaborator
        const entryPromises = entries.map(async (entryData) => {
          const entry = new SplitSheetEntry();
          entry.splitSheetId = savedSplitSheet.id;
          entry.recipientEmail = entryData.recipientEmail;
          entry.recipientName =
            entryData.recipientName || entryData.recipientEmail.split('@')[0];
          entry.percentage = new Decimal(entryData.percentage).toNumber();

          // Generate a unique claim token
          entry.claimToken = this.generateClaimToken();

          // Default status is PENDING
          entry.status = SplitEntryStatus.PENDING;

          // Check if the collaborator is an existing user
          const user = await this.userRepository.findOne({
            where: { email: entryData.recipientEmail },
          });

          if (user) {
            entry.userId = user.id;
            entry.user = user;
          }

          // Save the entry
          const savedEntry = await this.splitEntryRepository.save(entry);

          // Generate a claim link for the split entry
          const claimLink = this.generateClaimLink(savedEntry.claimToken);

          // Send a notification email to the collaborator
          await this.emailService.sendSplitNotification(
            entry.recipientEmail,
            claimLink,
            entry.recipientName,
            {
              songTitle: song.title,
              percentage: entry.percentage,
              claimToken: entry.claimToken,
            },
          );

          return savedEntry;
        });

        // Create a split sheet entry for the platform's service fee
        const platformFeeEntry = new SplitSheetEntry();
        platformFeeEntry.splitSheetId = savedSplitSheet.id;
        platformFeeEntry.recipientEmail = 'Platform Service Fee';
        platformFeeEntry.percentage = platformShare;
        platformFeeEntry.status = SplitEntryStatus.ACTIVE;
        platformFeeEntry.claimToken = this.generateClaimToken(); // Even though it won't be claimed, we need it for DB integrity

        // Execute all entry creation promises in parallel
        await Promise.all([
          ...entryPromises,
          this.splitEntryRepository.save(platformFeeEntry),
        ]);

        // Update song to point to the new splitsheet
        await this.songRepository.update(song.id, {
          currentSplitSheetId: savedSplitSheet.id,
        });

        // Entries are automatically linked via splitSheetId, no need to set entries array
      } catch (entryError) {
        // If entry creation fails, clean up the split sheet
        await this.splitSheetRepository.delete(savedSplitSheet.id);

        this.logError('Failed to create split sheet entries', {
          error: entryError,
        });
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to create split sheet entries: ${entryError.message}`,
        };
      }

      // Return the complete split sheet with all entries
      const completeSplitSheet = await this.splitSheetRepository.findOne({
        where: { id: savedSplitSheet.id },
        relations: ['entries', 'song'],
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Split sheet created successfully',
        data: completeSplitSheet,
      };
    } catch (error) {
      // Log the unexpected error
      this.logError('Unexpected error in createSplitSheet', { error });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Unexpected error creating split sheet: ${error.message}`,
      };
    }
  }
  //************************************* */
  //END OF THE SPLITSHEET CREATION FUNCTION
  //************************************* */

  //************************************* */
  //HELPER FUNCTIONS
  //************************************* */

  private logError(message: string, context?: any): void {
    this.logger.error({
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  // Validate the split entries to ensure the total percentage does not exceed the allowed limit
  private validateEntries(
    entries: CreateSplitSheetDto['entries'],
    serviceChargePercentage: number,
  ) {
    // Calculate the platform's percentage share
    const platformPercentage = new Decimal(serviceChargePercentage).toNumber(); // Convert to percentage

    // Calculate the maximum allowed percentage for collaborators
    const maxAllowedPercentage = 100 - platformPercentage;

    // Calculate the total percentage allocated to collaborators
    const totalPercentage = entries.reduce(
      (sum, entry) => sum + entry.percentage,
      0,
    );

    // Check if the total percentage exceeds the allowed limit
    if (totalPercentage > maxAllowedPercentage) {
      throw new HttpException(
        `Total percentage of split entries exceeds the allowed limit of ${maxAllowedPercentage}%.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Generate a unique claim token for a split entry
  private generateClaimToken(): string {
    return uuidv4();
  }

  // Generate a claim link using the claim token
  private generateClaimLink(claimToken: string): string {
    return `${this.configService.get('app.frontendDomain')}/splits/claim/${claimToken}`;
  }

  // New method to validate a claim token
  private async validateClaimToken(
    claimToken: string,
  ): Promise<SplitSheetEntry> {
    try {
      const entry = await this.splitEntryRepository.findOne({
        where: { claimToken },
        relations: ['splitSheet', 'splitSheet.song', 'user'],
      });

      if (!entry) {
        throw new NotFoundException(
          'Invalid claim token. Split entry not found.',
        );
      }

      if (entry.status !== SplitEntryStatus.PENDING) {
        throw new BadRequestException(
          'This split entry has already been claimed.',
        );
      }

      return entry;
    } catch (error) {
      this.logError('Error validating claim token', { claimToken, error });
      throw error;
    }
  }

  // Helper method to send update notifications
  private async sendUpdateNotification(notification: {
    type: 'removal' | 'update' | 'claim';
    email: string;
    name: string;
    oldPercentage?: number;
    newPercentage?: number;
    percentage?: number;
    songTitle: string;
    claimToken?: string;
  }): Promise<void> {
    switch (notification.type) {
      case 'removal':
        // Send removal notification email
        await this.emailService.sendSplitRemovalNotification(
          notification.email,
          notification.name,
          notification.songTitle,
          notification.oldPercentage,
        );
        break;

      case 'update':
        // Send update notification email with new claim link
        const updateClaimLink = this.generateClaimLink(notification.claimToken);
        await this.emailService.sendSplitUpdateNotification(
          notification.email,
          notification.name,
          notification.songTitle,
          notification.oldPercentage,
          notification.newPercentage,
          updateClaimLink,
          notification.claimToken,
        );
        break;

      case 'claim':
        // Send fresh claim notification
        const claimLink = this.generateClaimLink(notification.claimToken);
        await this.emailService.sendSplitNotification(
          notification.email,
          claimLink,
          notification.name,
          {
            songTitle: notification.songTitle,
            percentage: notification.percentage,
            claimToken: notification.claimToken,
          },
        );
        break;
    }
  }

  //************************************* */
  //END OF HELPER FUNCTIONS
  //************************************* */

  // Allow a user to claim a split entry using a claim token
  async claimSplitEntry(
    claimDto: ClaimSplitEntryDto,
    userId: string,
  ): Promise<ApiResponse<SplitSheetEntry>> {
    try {
      const { claimToken } = claimDto;

      // Validate the claim token and get the split entry
      const entry = await this.validateClaimToken(claimToken);

      // Find the user by ID
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        this.logError('User not found during claim process', { userId });
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found. Please ensure you are logged in.',
        };
      }

      // Check if the emails match
      if (entry.recipientEmail !== user.email) {
        this.logError('Email mismatch during claim process', {
          userEmail: user.email,
          entryEmail: entry.recipientEmail,
        });
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            'The email address on this split entry does not match your account email.',
        };
      }

      // Ensure the user has completed their profile before claiming the split
      if (
        !user.name ||
        !user.payoutMethods ||
        user.payoutMethods.length === 0
      ) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message:
            'Please complete your profile and add a payout method to claim this split.',
        };
      }

      // Update and save the entry
      entry.userId = userId;
      entry.user = user;
      entry.status = SplitEntryStatus.ACTIVE;

      const savedEntry = await this.splitEntryRepository.save(entry);

      return {
        statusCode: HttpStatus.OK,
        message: 'Split entry claimed successfully',
        data: savedEntry,
      };
    } catch (error) {
      this.logError('Error claiming split entry', { error });

      if (error instanceof HttpException) {
        return {
          statusCode: error.getStatus(),
          message: error.message,
        };
      }

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error claiming split entry: ${error.message}`,
      };
    }
  }

  // Get a split sheet by ID, including its associated song and entries
  async getSplitSheet(splitSheetId: string): Promise<ApiResponse<SplitSheet>> {
    try {
      const splitSheet = await this.splitSheetRepository.findOne({
        where: { id: splitSheetId },
        relations: ['song', 'entries', 'song.uploadedBy'],
      });

      if (!splitSheet) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Split sheet not found.',
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Split sheet retrieved successfully',
        data: splitSheet,
      };
    } catch (error) {
      this.logError('Error retrieving split sheet', { splitSheetId, error });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error retrieving split sheet: ${error.message}`,
      };
    }
  }

  // Update an existing split sheet using clean versioning strategy
  async updateSplitSheet(
    splitSheetId: string,
    updateSplitSheetDto: UpdateSplitSheetDto,
    userId: string,
  ): Promise<ApiResponse<SplitSheet>> {
    try {
      const { entries } = updateSplitSheetDto;

      // PHASE 1: VALIDATION & AUTHORIZATION
      const currentSplitSheet = await this.splitSheetRepository.findOne({
        where: { id: splitSheetId },
        relations: ['song', 'song.uploadedBy', 'entries'],
      });

      if (!currentSplitSheet) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Split sheet not found.',
        };
      }

      // Check authorization
      const isSongOwner = currentSplitSheet.song.uploadedBy.id === userId;
      const isPrimaryArtist =
        currentSplitSheet.song.primaryArtist?.user?.id === userId;

      if (!isSongOwner && !isPrimaryArtist) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            'You are not authorized to update this split sheet. Only the song owner or primary artist can update split sheets.',
        };
      }

      // BLOCK: Check if splitsheet is paid out
      if (currentSplitSheet.status === SplitSheetStatus.PAID_OUT) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Cannot modify a paid out split sheet',
        };
      }

      // BLOCK: Check if any entries are paid out
      const paidEntries = currentSplitSheet.entries.filter(
        (entry) => entry.status === SplitEntryStatus.PAID,
      );
      if (paidEntries.length > 0) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Cannot modify split sheet with paid out entries',
        };
      }

      // Validate new entries
      const serviceChargePercentage = 15;
      const validation = this.validateEntriesEnhanced(
        entries,
        serviceChargePercentage,
      );
      if (!validation.isValid) {
        this.logError('Enhanced split entry validation failed', {
          errors: validation.errors,
          entries,
        });
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid entries: ${validation.errors.join('; ')}`,
        };
      }

      // PHASE 2: CAPTURE CURRENT STATE FOR COMPARISON
      const currentActiveEntries = currentSplitSheet.entries.filter(
        (entry) =>
          entry.recipientEmail !== 'Platform Service Fee' &&
          entry.status !== SplitEntryStatus.INVALIDATED,
      );

      // PHASE 3: CREATE NEW SPLITSHEET
      const newSplitSheet = this.splitSheetRepository.create({
        song: currentSplitSheet.song,
        status: SplitSheetStatus.ACTIVE,
        lastModifiedBy: userId,
        version: currentSplitSheet.version + 1,
        previousVersionId: currentSplitSheet.id,
      });

      // Save the new splitsheet first to get an ID
      let savedNewSplitSheet;
      try {
        savedNewSplitSheet =
          await this.splitSheetRepository.save(newSplitSheet);
      } catch (dbError) {
        this.logError('Failed to create new split sheet version', {
          error: dbError,
        });
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to create new split sheet version: ${dbError.message}`,
        };
      }

      // PHASE 4: CREATE NEW ENTRIES
      try {
        // Create new split sheet entries for each collaborator
        const newEntryPromises = entries.map(async (entryData) => {
          const entry = new SplitSheetEntry();
          entry.splitSheetId = savedNewSplitSheet.id;
          entry.recipientEmail = entryData.recipientEmail;
          entry.recipientName =
            entryData.recipientName || entryData.recipientEmail.split('@')[0];
          entry.percentage = new Decimal(entryData.percentage).toNumber();
          entry.claimToken = this.generateClaimToken();
          entry.status = SplitEntryStatus.PENDING;

          // Check if the collaborator is an existing user
          const user = await this.userRepository.findOne({
            where: { email: entryData.recipientEmail },
          });

          if (user) {
            entry.userId = user.id;
            entry.user = user;
          }

          return await this.splitEntryRepository.save(entry);
        });

        // Create platform fee entry
        const platformFeeEntry = new SplitSheetEntry();
        platformFeeEntry.splitSheetId = savedNewSplitSheet.id;
        platformFeeEntry.recipientEmail = 'Platform Service Fee';
        platformFeeEntry.percentage = serviceChargePercentage;
        platformFeeEntry.status = SplitEntryStatus.ACTIVE;
        platformFeeEntry.claimToken = this.generateClaimToken();

        // Execute all entry creation promises
        const [newEntries] = await Promise.all([
          Promise.all(newEntryPromises),
          this.splitEntryRepository.save(platformFeeEntry),
        ]);

        // PHASE 5: UPDATE SONG TO POINT TO NEW SPLITSHEET
        await this.songRepository.update(currentSplitSheet.song.id, {
          currentSplitSheetId: savedNewSplitSheet.id,
        });

        // PHASE 6: ARCHIVE OLD SPLITSHEET
        await this.splitSheetRepository.update(currentSplitSheet.id, {
          status: SplitSheetStatus.ARCHIVED,
          replacedAt: new Date(),
          replacedBy: userId,
        });

        // PHASE 7: NOTIFICATION ANALYSIS & SENDING
        const currentEmails = new Set(
          currentActiveEntries.map((e) => e.recipientEmail),
        );
        const newEmails = new Set(entries.map((e) => e.recipientEmail));

        // Identify removed collaborators
        const removedCollaborators = currentActiveEntries.filter(
          (entry) => !newEmails.has(entry.recipientEmail),
        );

        // Identify continuing collaborators
        const continuingCollaborators = currentActiveEntries.filter((entry) =>
          newEmails.has(entry.recipientEmail),
        );

        // Identify new collaborators
        const newCollaborators = newEntries.filter(
          (entry) => !currentEmails.has(entry.recipientEmail),
        );

        // Send notifications
        const notificationPromises = [];

        // Notify removed collaborators
        for (const removedEntry of removedCollaborators) {
          if (removedEntry.status === SplitEntryStatus.ACTIVE) {
            notificationPromises.push(
              this.sendUpdateNotification({
                type: 'removal',
                email: removedEntry.recipientEmail,
                name: removedEntry.recipientName,
                oldPercentage: removedEntry.percentage,
                songTitle: currentSplitSheet.song.title,
              }),
            );
          }
        }

        // Notify continuing collaborators
        for (const continuingEntry of continuingCollaborators) {
          const newEntry = newEntries.find(
            (e) => e.recipientEmail === continuingEntry.recipientEmail,
          );
          if (newEntry) {
            if (continuingEntry.status === SplitEntryStatus.ACTIVE) {
              notificationPromises.push(
                this.sendUpdateNotification({
                  type: 'update',
                  email: continuingEntry.recipientEmail,
                  name: continuingEntry.recipientName,
                  oldPercentage: continuingEntry.percentage,
                  newPercentage: newEntry.percentage,
                  songTitle: currentSplitSheet.song.title,
                  claimToken: newEntry.claimToken,
                }),
              );
            } else {
              // Was pending, send fresh claim
              notificationPromises.push(
                this.sendUpdateNotification({
                  type: 'claim',
                  email: newEntry.recipientEmail,
                  name: newEntry.recipientName,
                  percentage: newEntry.percentage,
                  songTitle: currentSplitSheet.song.title,
                  claimToken: newEntry.claimToken,
                }),
              );
            }
          }
        }

        // Notify new collaborators
        for (const newEntry of newCollaborators) {
          notificationPromises.push(
            this.sendUpdateNotification({
              type: 'claim',
              email: newEntry.recipientEmail,
              name: newEntry.recipientName,
              percentage: newEntry.percentage,
              songTitle: currentSplitSheet.song.title,
              claimToken: newEntry.claimToken,
            }),
          );
        }

        // Send all notifications (don't fail the update if emails fail)
        await Promise.allSettled(notificationPromises);

        // Return the new splitsheet with entries
        const completeSplitSheet = await this.splitSheetRepository.findOne({
          where: { id: savedNewSplitSheet.id },
          relations: ['entries', 'song'],
        });

        return {
          statusCode: HttpStatus.OK,
          message: 'Split sheet updated successfully',
          data: completeSplitSheet,
        };
      } catch (entryError) {
        // If entry creation fails, clean up the new split sheet
        await this.splitSheetRepository.delete(savedNewSplitSheet.id);

        this.logError('Failed to create new split sheet entries', {
          error: entryError,
        });
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to create new split sheet entries: ${entryError.message}`,
        };
      }
    } catch (error) {
      this.logError('Error updating split sheet', { splitSheetId, error });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error updating split sheet: ${error.message}`,
      };
    }
  }

  // Verify a claim token without actually claiming it
  async verifyClaimToken(
    claimToken: string,
  ): Promise<ApiResponse<{ isValid: boolean; entryDetails?: any }>> {
    try {
      const entry = await this.splitEntryRepository.findOne({
        where: { claimToken },
        relations: ['splitSheet', 'splitSheet.song'],
      });

      if (!entry) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Invalid claim token',
          data: { isValid: false },
        };
      }

      if (entry.status !== SplitEntryStatus.PENDING) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'This split entry has already been claimed',
          data: { isValid: false },
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Valid claim token',
        data: {
          isValid: true,
          entryDetails: {
            songTitle: entry.splitSheet.song.title,
            percentage: entry.percentage,
            email: entry.recipientEmail,
          },
        },
      };
    } catch (error) {
      this.logError('Error verifying claim token', { claimToken, error });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error verifying claim token: ${error.message}`,
        data: { isValid: false },
      };
    }
  }

  // Get all split entries for a specific user
  async getUserSplits(userId: string): Promise<ApiResponse<SplitSheetEntry[]>> {
    try {
      const entries = await this.splitEntryRepository.find({
        where: { userId },
        relations: ['splitSheet', 'splitSheet.song'],
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'User splits retrieved successfully',
        data: entries,
      };
    } catch (error) {
      this.logError('Error retrieving user splits', { userId, error });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error retrieving user splits: ${error.message}`,
      };
    }
  }

  // Get all split entries for a specific split sheet
  async getSplitSheetEntries(
    splitSheetId: string,
  ): Promise<ApiResponse<SplitSheetEntry[]>> {
    try {
      const entries = await this.splitEntryRepository.find({
        where: { splitSheetId },
        relations: ['splitSheet', 'user'],
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Split sheet entries retrieved successfully',
        data: entries,
      };
    } catch (error) {
      this.logError('Error retrieving split sheet entries', {
        splitSheetId,
        error,
      });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error retrieving split sheet entries: ${error.message}`,
      };
    }
  }

  // Find all split entries associated with a specific email address
  async findAllSplitsByEmail(
    email: string,
  ): Promise<ApiResponse<SplitSheetEntry[]>> {
    try {
      const entries = await this.splitEntryRepository.find({
        where: { recipientEmail: email },
        relations: ['splitSheet', 'splitSheet.song'],
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Splits by email retrieved successfully',
        data: entries,
      };
    } catch (error) {
      this.logError('Error retrieving splits by email', { email, error });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error retrieving splits by email: ${error.message}`,
      };
    }
  }

  // Calculate the split amount for a given amount and percentage
  async calculateSplitAmount(
    amount: number,
    percentage: number,
  ): Promise<number> {
    return new Decimal(amount)
      .times(new Decimal(percentage).dividedBy(100))
      .toNumber();
  }

  // Allow resending claim emails for pending entries
  async resendClaimEmail(
    entryId: string,
    userId: string,
  ): Promise<ApiResponse<{ sent: boolean }>> {
    try {
      const entry = await this.splitEntryRepository.findOne({
        where: { id: entryId },
        relations: [
          'splitSheet',
          'splitSheet.song',
          'splitSheet.song.uploadedBy',
        ],
      });

      if (!entry) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Split entry not found',
          data: { sent: false },
        };
      }

      // Check if the requestor is the song owner
      if (entry.splitSheet.song.uploadedBy.id !== userId) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            'You are not authorized to resend claim emails for this entry',
          data: { sent: false },
        };
      }

      // Only resend for pending entries
      if (entry.status !== SplitEntryStatus.PENDING) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Cannot resend claim email for non-pending entries',
          data: { sent: false },
        };
      }

      // Regenerate claim token for security
      entry.claimToken = this.generateClaimToken();
      await this.splitEntryRepository.save(entry);

      // Generate claim link
      const claimLink = this.generateClaimLink(entry.claimToken);

      // Send email
      await this.emailService.sendSplitNotification(
        entry.recipientEmail,
        claimLink,
        entry.recipientName || entry.recipientEmail.split('@')[0],
        {
          songTitle: entry.splitSheet.song.title,
          percentage: entry.percentage,
          claimToken: entry.claimToken,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Claim email resent successfully',
        data: { sent: true },
      };
    } catch (error) {
      this.logError('Error resending claim email', { entryId, error });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error resending claim email: ${error.message}`,
        data: { sent: false },
      };
    }
  }

  /**
   * Gets the split sheet associated with a song, if it exists
   * @param songId The ID of the song
   * @returns The split sheet information or null if none exists
   */
  async getSplitSheetBySongId(songId: string): Promise<{
    currentSplitSheetId: string;
    currentSplitSheet: SplitSheet & {
      entries: SplitSheetEntry[];
    };
  } | null> {
    try {
      // Find the song with its current split sheet
      const song = await this.songRepository.findOne({
        where: { id: songId },
        relations: ['currentSplitSheet', 'currentSplitSheet.entries'],
      });

      if (!song || !song.currentSplitSheet) {
        return null;
      }

      // Return the current active split sheet with its entries
      return {
        currentSplitSheetId: song.currentSplitSheet.id,
        currentSplitSheet: {
          ...song.currentSplitSheet,
          entries: song.currentSplitSheet.entries,
        },
      };
    } catch (error) {
      this.logError('Error retrieving split sheet by song ID', {
        songId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Gets the complete splitsheet history for a song
   * @param songId The ID of the song
   * @returns All splitsheet versions with their entries and metadata
   */
  async getSplitSheetHistory(songId: string): Promise<
    ApiResponse<{
      song: {
        id: string;
        title: string;
        uploadedBy: {
          id: string;
          name: string;
          email: string;
        };
      };
      currentSplitSheetId: string | null;
      totalVersions: number;
      history: Array<{
        id: string;
        version: number;
        status: SplitSheetStatus;
        createdAt: Date;
        updatedAt: Date;
        lastModifiedBy: string | null;
        replacedAt: Date | null;
        replacedBy: string | null;
        previousVersionId: string | null;
        entries: Array<{
          id: string;
          recipientEmail: string;
          recipientName: string | null;
          percentage: number;
          status: SplitEntryStatus;
          userId: string | null;
          claimToken: string;
        }>;
        summary: {
          totalCollaborators: number;
          activeCollaborators: number;
          pendingCollaborators: number;
          platformFeePercentage: number;
        };
      }>;
    }>
  > {
    try {
      // Find the song with basic info
      const song = await this.songRepository.findOne({
        where: { id: songId },
        relations: ['uploadedBy'],
        select: {
          id: true,
          title: true,
          currentSplitSheetId: true,
          uploadedBy: {
            id: true,
            name: true,
            email: true,
          },
        },
      });

      if (!song) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Song not found.',
        };
      }

      // Find all splitsheets for this song, ordered by version
      const splitSheets = await this.splitSheetRepository.find({
        where: { song: { id: songId } },
        relations: ['entries'],
        order: { version: 'DESC', createdAt: 'DESC' },
      });

      if (splitSheets.length === 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'No splitsheet history found for this song.',
          data: {
            song: {
              id: song.id,
              title: song.title,
              uploadedBy: song.uploadedBy,
            },
            currentSplitSheetId: song.currentSplitSheetId,
            totalVersions: 0,
            history: [],
          },
        };
      }

      // Process each splitsheet version
      const history = splitSheets.map((splitSheet) => {
        // Separate platform fee from collaborators
        const collaboratorEntries = splitSheet.entries.filter(
          (entry) => entry.recipientEmail !== 'Platform Service Fee',
        );
        const platformFeeEntry = splitSheet.entries.find(
          (entry) => entry.recipientEmail === 'Platform Service Fee',
        );

        // Calculate summary statistics
        const activeCollaborators = collaboratorEntries.filter(
          (entry) => entry.status === SplitEntryStatus.ACTIVE,
        ).length;
        const pendingCollaborators = collaboratorEntries.filter(
          (entry) => entry.status === SplitEntryStatus.PENDING,
        ).length;

        return {
          id: splitSheet.id,
          version: splitSheet.version,
          status: splitSheet.status,
          createdAt: splitSheet.createdAt,
          updatedAt: splitSheet.updatedAt,
          lastModifiedBy: splitSheet.lastModifiedBy,
          replacedAt: splitSheet.replacedAt,
          replacedBy: splitSheet.replacedBy,
          previousVersionId: splitSheet.previousVersionId,
          entries: splitSheet.entries.map((entry) => ({
            id: entry.id,
            recipientEmail: entry.recipientEmail,
            recipientName: entry.recipientName,
            percentage: entry.percentage,
            status: entry.status,
            userId: entry.userId,
            claimToken: entry.claimToken,
          })),
          summary: {
            totalCollaborators: collaboratorEntries.length,
            activeCollaborators,
            pendingCollaborators,
            platformFeePercentage: platformFeeEntry?.percentage || 0,
          },
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Splitsheet history retrieved successfully',
        data: {
          song: {
            id: song.id,
            title: song.title,
            uploadedBy: song.uploadedBy,
          },
          currentSplitSheetId: song.currentSplitSheetId,
          totalVersions: splitSheets.length,
          history,
        },
      };
    } catch (error) {
      this.logError('Error retrieving splitsheet history', {
        songId,
        error: error.message,
      });

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Error retrieving splitsheet history: ${error.message}`,
      };
    }
  }

  //************************************* */
  //ENHANCED VALIDATION & ERROR PREVENTION
  //************************************* */

  // Enhanced email validation
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Enhanced percentage validation
  private validatePercentage(percentage: number): boolean {
    return (
      typeof percentage === 'number' &&
      !isNaN(percentage) &&
      percentage >= 0.01 &&
      percentage <= 100 &&
      Number.isFinite(percentage)
    );
  }

  // Validate entries with comprehensive checks
  private validateEntriesEnhanced(
    entries: CreateSplitSheetDto['entries'],
    serviceChargePercentage: number,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check minimum entries
    if (!entries || entries.length === 0) {
      errors.push('At least one collaborator entry is required');
    }

    // Check maximum entries (prevent system overload)
    if (entries && entries.length > 50) {
      errors.push('Maximum 50 collaborators allowed per split sheet');
    }

    entries?.forEach((entry, index) => {
      // Email validation
      if (!entry.recipientEmail) {
        errors.push(`Entry ${index + 1}: Email is required`);
      } else if (!this.validateEmail(entry.recipientEmail)) {
        errors.push(`Entry ${index + 1}: Invalid email format`);
      }

      // Percentage validation
      if (!this.validatePercentage(entry.percentage)) {
        errors.push(
          `Entry ${index + 1}: Percentage must be between 0.01 and 100`,
        );
      }

      // Name validation
      if (entry.recipientName && entry.recipientName.length > 100) {
        errors.push(`Entry ${index + 1}: Name too long (max 100 characters)`);
      }
    });

    // Platform percentage validation
    const platformPercentage = new Decimal(serviceChargePercentage).toNumber();
    const maxAllowedPercentage = 100 - platformPercentage;
    const totalPercentage =
      entries?.reduce((sum, entry) => sum + entry.percentage, 0) || 0;

    if (totalPercentage > maxAllowedPercentage) {
      errors.push(
        `Total percentage exceeds allowed limit of ${maxAllowedPercentage}%`,
      );
    }

    if (totalPercentage < 0.01) {
      errors.push('Total percentage must be at least 0.01%');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Safe email sending with retry logic
  private async sendEmailSafely(
    emailFn: () => Promise<void>,
    context: string,
  ): Promise<{ success: boolean; error?: string }> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await emailFn();
        return { success: true };
      } catch (error) {
        lastError = error;
        this.logError(`Email send attempt ${attempt} failed for ${context}`, {
          error: error.message,
          attempt,
        });

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          );
        }
      }
    }

    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError?.message}`,
    };
  }

  // Ensure claim token uniqueness
  private async generateUniqueClaimToken(): Promise<string> {
    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const token = this.generateClaimToken();
      const existing = await this.splitEntryRepository.findOne({
        where: { claimToken: token },
      });

      if (!existing) {
        return token;
      }

      this.logError('Claim token collision detected', { token, attempt });
    }

    throw new Error('Failed to generate unique claim token');
  }

  // Race condition prevention for claim operations
  private async claimWithLock(
    claimToken: string,
    userId: string,
  ): Promise<SplitSheetEntry | null> {
    // Use database-level locking to prevent race conditions
    const queryRunner =
      this.splitEntryRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Lock the entry for update
      const entry = await queryRunner.manager
        .createQueryBuilder(SplitSheetEntry, 'entry')
        .setLock('pessimistic_write')
        .where('entry.claimToken = :claimToken', { claimToken })
        .andWhere('entry.status = :status', {
          status: SplitEntryStatus.PENDING,
        })
        .getOne();

      if (!entry) {
        await queryRunner.rollbackTransaction();
        return null;
      }

      // Update the entry
      entry.userId = userId;
      entry.status = SplitEntryStatus.ACTIVE;
      const savedEntry = await queryRunner.manager.save(entry);

      await queryRunner.commitTransaction();
      return savedEntry;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  //************************************* */
  //END OF ENHANCED VALIDATION & ERROR PREVENTION
  //************************************* */
}
/****************************END OF ADD NEW CODE LIST */
