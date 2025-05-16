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
import { SplitSheet } from './entities/splitsheet.entity';
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

      // Check if the current user is the owner of the song
      if (song.uploadedBy.id !== userId) {
        this.logError('Unauthorized split sheet creation', { songId, userId });
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message:
            'You are not authorized to create a split sheet for this song.',
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

      // Validate the split entries
      try {
        this.validateEntries(entries, serviceChargePercentage);
      } catch (validationError) {
        this.logError('Split entry validation failed', {
          error: validationError.message,
          entries,
        });
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Invalid entries: ${validationError.message || 'Validation failed'}`,
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
      const splitSheet = this.splitSheetRepository.create({ song });

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
          entry.splitSheet = savedSplitSheet;
          entry.recipientEmail = entryData.recipientEmail;
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

          const recipientName = entryData.recipientName || 'Contributor';

          // Send a notification email to the collaborator
          await this.emailService.sendSplitNotification(
            entry.recipientEmail,
            claimLink,
            recipientName,
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
        platformFeeEntry.splitSheet = savedSplitSheet;
        platformFeeEntry.recipientEmail = 'Platform Service Fee';
        platformFeeEntry.percentage = platformShare;
        platformFeeEntry.status = SplitEntryStatus.ACTIVE;
        platformFeeEntry.claimToken = this.generateClaimToken(); // Even though it won't be claimed, we need it for DB integrity

        // Execute all entry creation promises in parallel
        const createdEntries = await Promise.all([
          ...entryPromises,
          this.splitEntryRepository.save(platformFeeEntry),
        ]);

        // Update the split sheet with the created entries
        savedSplitSheet.entries = createdEntries;
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

  // Update an existing split sheet
  async updateSplitSheet(
    splitSheetId: string,
    updateSplitSheetDto: UpdateSplitSheetDto,
    userId: string,
  ): Promise<ApiResponse<SplitSheet>> {
    try {
      const { entries } = updateSplitSheetDto;

      // Get the split sheet and its associated song
      const splitSheet = await this.splitSheetRepository.findOne({
        where: { id: splitSheetId },
        relations: ['song', 'song.uploadedBy', 'entries'], // Load the song, its owner, and existing entries
      });

      if (!splitSheet) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Split sheet not found.',
        };
      }

      // Check if the current user is the owner of the song
      if (splitSheet.song.uploadedBy.id !== userId) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'You are not authorized to update this split sheet',
        };
      }

      // Get the service charge percentage from the configuration
      const serviceChargePercentage = 15;

      // Validate the updated split entries
      try {
        this.validateEntries(entries, serviceChargePercentage);
      } catch (validationError) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: validationError.message,
        };
      }

      // Get the platform fee entry
      const platformFeeEntry = splitSheet.entries.find(
        (e) => e.recipientEmail === 'Platform Service Fee',
      );

      // Calculate total percentage to ensure it's valid
      const totalPercentage = entries.reduce(
        (sum, entry) => sum + new Decimal(entry.percentage).toNumber(),
        0,
      );

      // Validate that total percentages (including platform fee) equals 100
      if (Math.abs(totalPercentage + serviceChargePercentage - 100) > 0.01) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Total percentage must equal exactly 100%. Current total: ${(totalPercentage + serviceChargePercentage).toFixed(2)}%`,
        };
      }

      // Check for duplicate email entries in the update
      const emailsSet = new Set<string>();
      for (const entry of entries) {
        if (emailsSet.has(entry.recipientEmail)) {
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Duplicate recipient email found: ${entry.recipientEmail}`,
          };
        }
        emailsSet.add(entry.recipientEmail);
      }

      // Process the entries
      const updatedEntries = [];

      // First, keep the platform fee entry
      updatedEntries.push(platformFeeEntry);

      // Process each entry in the update DTO
      for (const entryData of entries) {
        if (entryData.id) {
          // Update existing entry
          const existingEntry = splitSheet.entries.find(
            (e) =>
              e.id === entryData.id &&
              e.recipientEmail !== 'Platform Service Fee',
          );

          if (existingEntry) {
            existingEntry.percentage = new Decimal(
              entryData.percentage,
            ).toNumber();

            // If the email has changed, update it and reset the entry
            if (existingEntry.recipientEmail !== entryData.recipientEmail) {
              existingEntry.recipientEmail = entryData.recipientEmail;
              existingEntry.userId = null;
              existingEntry.user = null;
              existingEntry.status = SplitEntryStatus.PENDING;
              existingEntry.claimToken = this.generateClaimToken();

              // Send a new notification email
              const claimLink = this.generateClaimLink(
                existingEntry.claimToken,
              );
              const recipientName = entryData.recipientName || 'Contributor';

              await this.emailService.sendSplitNotification(
                existingEntry.recipientEmail,
                claimLink,
                recipientName,
                {
                  songTitle: splitSheet.song.title,
                  percentage: existingEntry.percentage,
                  claimToken: existingEntry.claimToken,
                },
              );
            }

            updatedEntries.push(existingEntry);
          }
        } else {
          // Create a new entry
          const newEntry = this.splitEntryRepository.create({
            splitSheet,
            recipientEmail: entryData.recipientEmail,
            percentage: new Decimal(entryData.percentage).toNumber(),
            status: SplitEntryStatus.PENDING,
            claimToken: this.generateClaimToken(),
          });

          // Check if the collaborator is an existing user
          const user = await this.userRepository.findOne({
            where: { email: entryData.recipientEmail },
          });

          if (user) {
            newEntry.userId = user.id;
            newEntry.user = user;
            newEntry.status = SplitEntryStatus.ACTIVE;
          }

          // Save the new entry
          const savedEntry = await this.splitEntryRepository.save(newEntry);

          // Send a notification email if status is PENDING
          if (newEntry.status === SplitEntryStatus.PENDING) {
            const claimLink = this.generateClaimLink(newEntry.claimToken);
            const recipientName = entryData.recipientName || 'Contributor';

            await this.emailService.sendSplitNotification(
              newEntry.recipientEmail,
              claimLink,
              recipientName,
              {
                songTitle: splitSheet.song.title,
                percentage: newEntry.percentage,
                claimToken: newEntry.claimToken,
              },
            );
          }

          updatedEntries.push(savedEntry);
        }
      }

      // Update the split sheet with the updated entries
      splitSheet.entries = updatedEntries;

      // Save the updated split sheet
      const savedSplitSheet = await this.splitSheetRepository.save(splitSheet);

      return {
        statusCode: HttpStatus.OK,
        message: 'Split sheet updated successfully',
        data: savedSplitSheet,
      };
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
        'Contributor', // Default name
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
    splitSheetId: string;
    splitSheet: SplitSheet & {
      entries: SplitSheetEntry[];
    };
  } | null> {
    try {
      // Find the split sheet for the song
      const splitSheet = await this.splitSheetRepository.findOne({
        where: { song: { id: songId } },
        relations: ['entries'],
      });

      if (!splitSheet) {
        return null;
      }

      // Return the split sheet with its entries
      return {
        splitSheetId: splitSheet.id,
        splitSheet: {
          ...splitSheet,
          entries: splitSheet.entries,
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
}
/****************************END OF ADD NEW CODE LIST */
