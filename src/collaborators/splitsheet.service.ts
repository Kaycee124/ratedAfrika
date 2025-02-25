// import {
//   Injectable,
//   HttpException,
//   HttpStatus,
//   BadRequestException,
//   NotFoundException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { SplitSheet } from './entities/splitsheet.entity';
// import {
//   SplitSheetEntry,
//   SplitEntryStatus,
// } from './entities/SplitSheetEntry.entity';
// import { CreateSplitSheetDto } from './dto/collaborator.dto';
// import { Decimal } from 'decimal.js';
// import { Song } from 'src/songs/entities/song.entity';
// import { User } from 'src/users/user.entity';
// import { ClaimSplitEntryDto } from './dto/collaborator.dto';
// import { UpdateSplitSheetDto } from './dto/collaborator.dto';
// import { EmailService } from 'src/auth/services/email.service';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class SplitSheetService {
//   constructor(
//     @InjectRepository(SplitSheet)
//     private readonly splitSheetRepository: Repository<SplitSheet>,
//     @InjectRepository(SplitSheetEntry)
//     private readonly splitEntryRepository: Repository<SplitSheetEntry>,
//     @InjectRepository(Song)
//     private readonly songRepository: Repository<Song>,
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//     private readonly emailService: EmailService,
//     private readonly configService: ConfigService,
//   ) {}

//   async createSplitSheet(
//     createSplitSheetDto: CreateSplitSheetDto,
//   ): Promise<SplitSheet> {
//     const { songId, entries } = createSplitSheetDto;

//     const existingSplitSheet = await this.splitSheetRepository.findOne({
//       where: { song: { id: songId } },
//     });
//     if (existingSplitSheet) {
//       throw new HttpException(
//         'A split sheet already exists for this song. Please update the existing split sheet.',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     const song = await this.songRepository.findOne({ where: { id: songId } });
//     if (!song) {
//       throw new BadRequestException('Song not found.');
//     }

//     this.validateEntries(entries);

//     const serviceChargePercentage = this.configService.get<number>(
//       'splits.serviceChargePercentage',
//     );
//     const platformShare = this.calculatePlatformShare(
//       entries,
//       serviceChargePercentage,
//     );

//     const splitSheet = this.splitSheetRepository.create({ song });

//     splitSheet.entries = await Promise.all(
//       entries.map(async (entryData) => {
//         const entry = new SplitSheetEntry();
//         entry.recipientEmail = entryData.recipientEmail;

//         const user = await this.userRepository.findOne({
//           where: { email: entryData.recipientEmail },
//         });
//         if (user) {
//           entry.userId = user.id;
//           entry.user = user;
//           entry.status = SplitEntryStatus.ACTIVE;
//         } else {
//           entry.status = SplitEntryStatus.PENDING;
//         }

//         const existingEntry = await this.splitEntryRepository.findOne({
//           where: {
//             splitSheet: { id: splitSheet.id },
//             recipientEmail: entryData.recipientEmail,
//           },
//         });
//         if (existingEntry) {
//           throw new HttpException(
//             'Duplicate split entry found.',
//             HttpStatus.BAD_REQUEST,
//           );
//         }

//         entry.percentage = new Decimal(entryData.percentage).toNumber();

//         const claimLink = await this.generateClaimLink(entry.id);
//         const recipientName = entryData.recipientName || 'Contributor';
//         await this.emailService.sendSplitNotification(
//           entry.recipientEmail,
//           claimLink,
//           recipientName,
//         );

//         return entry;
//       }),
//     );

//     const platformFeeEntry = new SplitSheetEntry();
//     platformFeeEntry.recipientEmail = 'Platform Service Fee';
//     platformFeeEntry.percentage = platformShare;
//     platformFeeEntry.status = SplitEntryStatus.PENDING;

//     splitSheet.entries.push(platformFeeEntry);

//     return await this.splitSheetRepository.save(splitSheet);
//   }

//   private validateEntries(entries: CreateSplitSheetDto['entries']) {
//     const totalPercentage = entries.reduce(
//       (sum, entry) => sum + entry.percentage,
//       0,
//     );
//     const serviceChargePercentage = this.configService.get<number>(
//       'splits.serviceChargePercentage',
//     );
//     const maxAllowedPercentage = 100 - serviceChargePercentage * 100;

//     if (totalPercentage > maxAllowedPercentage) {
//       throw new HttpException(
//         `Total percentage of split entries exceeds the allowed limit of ${maxAllowedPercentage}%.`,
//         HttpStatus.BAD_REQUEST,
//       );
//     }
//   }

//   private calculatePlatformShare(
//     entries: CreateSplitSheetDto['entries'],
//     serviceChargePercentage: number,
//   ): number {
//     const totalPercentage = entries.reduce(
//       (sum, entry) => sum + entry.percentage,
//       0,
//     );
//     return new Decimal(serviceChargePercentage)
//       .times(100 - totalPercentage)
//       .toNumber();
//   }

//   private async generateClaimLink(entryId: string): Promise<string> {
//     const encryptedId = await this.encryptEntryId(entryId);
//     return `${this.configService.get('app.frontendDomain')}/splits/claim/${encryptedId}`;
//   }

//   private async encryptEntryId(entryId: string): Promise<string> {
//     // Implement your encryption logic here
//     return 'encrypted:' + entryId;
//   }

//   private async decryptEntryId(encryptedId: string): Promise<string> {
//     // Implement your decryption logic here
//     return encryptedId.replace('encrypted:', '');
//   }

//   async claimSplitEntry(
//     encryptedEntryId: string,
//     userId: string,
//   ): Promise<SplitSheetEntry> {
//     const entryId = await this.decryptEntryId(encryptedEntryId);

//     const entry = await this.splitEntryRepository.findOne({
//       where: { id: entryId },
//       relations: ['user'],
//     });
//     if (!entry) {
//       throw new NotFoundException('Split entry not found.');
//     }

//     if (entry.userId && entry.userId !== userId) {
//       throw new BadRequestException(
//         'Split entry already claimed by another user.',
//       );
//     }

//     const user = await this.userRepository.findOne({ where: { id: userId } });
//     if (!user) {
//       throw new NotFoundException('User not found.');
//     }
//     if (!user.name || !user.payoutMethods) {
//       throw new BadRequestException(
//         'Please complete your profile to claim this split.',
//       );
//     }

//     entry.userId = userId;
//     entry.user = user;
//     entry.status = SplitEntryStatus.ACTIVE;
//     return await this.splitEntryRepository.save(entry);
//   }

//   async getSplitSheet(splitSheetId: string): Promise<SplitSheet> {
//     const splitSheet = await this.splitSheetRepository.findOne({
//       where: { id: splitSheetId },
//       relations: ['song', 'entries'],
//     });

//     if (!splitSheet) {
//       throw new NotFoundException('Split sheet not found.');
//     }

//     return splitSheet;
//   }

//   async updateSplitSheet(
//     splitSheetId: string,
//     updateSplitSheetDto: UpdateSplitSheetDto,
//   ): Promise<SplitSheet> {
//     const { entries } = updateSplitSheetDto;

//     const splitSheet = await this.getSplitSheet(splitSheetId);

//     this.validateEntries(entries);

//     splitSheet.entries = await Promise.all(
//       entries.map(async (entryData) => {
//         let entry = splitSheet.entries.find((e) => e.id === entryData.id);

//         if (entry) {
//           entry.recipientEmail = entryData.recipientEmail;
//           entry.percentage = new Decimal(entryData.percentage).toNumber();
//         } else {
//           entry = new SplitSheetEntry();
//           entry.recipientEmail = entryData.recipientEmail;
//           entry.percentage = new Decimal(entryData.percentage).toNumber();
//           entry.splitSheet = splitSheet;

//           const user = await this.userRepository.findOne({
//             where: { email: entryData.recipientEmail },
//           });
//           if (user) {
//             entry.userId = user.id;
//             entry.user = user;
//             entry.status = SplitEntryStatus.ACTIVE;
//           } else {
//             entry.status = SplitEntryStatus.PENDING;
//           }
//         }

//         return entry;
//       }),
//     );

//     const serviceChargePercentage = this.configService.get<number>(
//       'splits.serviceChargePercentage',
//     );
//     const platformShare = this.calculatePlatformShare(
//       entries,
//       serviceChargePercentage,
//     );

//     let platformFeeEntry = splitSheet.entries.find(
//       (e) => e.recipientEmail === 'Platform Service Fee',
//     );
//     if (platformFeeEntry) {
//       platformFeeEntry.percentage = platformShare;
//     } else {
//       platformFeeEntry = new SplitSheetEntry();
//       platformFeeEntry.recipientEmail = 'Platform Service Fee';
//       platformFeeEntry.percentage = platformShare;
//       platformFeeEntry.status = SplitEntryStatus.PENDING;
//       splitSheet.entries.push(platformFeeEntry);
//     }

//     return await this.splitSheetRepository.save(splitSheet);
//   }

//   async getUserSplits(userId: string): Promise<SplitSheetEntry> {
//     return await this.splitEntryRepository.find({
//       where: { userId },
//       relations: ['splitSheet', 'splitSheet.song'],
//     });
//   }

//   async getSplitSheetEntries(splitSheetId: string): Promise<SplitSheetEntry> {
//     const entries = await this.splitEntryRepository.find({
//       where: { splitSheetId },
//       relations: ['splitSheet', 'user'],
//     });
//     return entries;
//   }

//   async findAllSplitsByEmail(email: string): Promise<SplitSheetEntry> {
//     return await this.splitEntryRepository.find({
//       where: { recipientEmail: email },
//       relations: ['splitSheet', 'splitSheet.song'],
//     });
//   }
//   async calculateSplitAmount(
//     amount: number,
//     percentage: number,
//   ): Promise<number> {
//     return new Decimal(amount)
//       .times(new Decimal(percentage).dividedBy(100))
//       .toNumber();
//   }
// }

// Another fixed version of the code

import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SplitSheet } from './entities/splitsheet.entity';
import {
  SplitSheetEntry,
  SplitEntryStatus,
} from './entities/SplitSheetEntry.entity';
import { CreateSplitSheetDto } from './dto/collaborator.dto';
import { Decimal } from 'decimal.js';
import { Song } from 'src/songs/entities/song.entity';
import { User } from 'src/users/user.entity';
// import { ClaimSplitEntryDto } from './dto/collaborator.dto'; // Removed unused import
import { UpdateSplitSheetDto } from './dto/collaborator.dto';
import { EmailService } from 'src/auth/services/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SplitSheetService {
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
  ) {}

  // async createSplitSheet(
  //   createSplitSheetDto: CreateSplitSheetDto,
  //   userId: string,
  // ): Promise<SplitSheet> {
  //   const { songId, entries } = createSplitSheetDto;

  //   // Check if a split sheet already exists for the song
  //   const existingSplitSheet = await this.splitSheetRepository.findOne({
  //     where: { song: { id: songId } },
  //   });
  //   if (existingSplitSheet) {
  //     throw new HttpException(
  //       'A split sheet already exists for this song. Please update the existing split sheet.',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   const song = await this.songRepository.findOne({
  //     where: { id: songId },
  //     relations: ['uploadedBy'], // Ensure uploadedBy is loaded
  //   });
  //   if (!song) {
  //     throw new BadRequestException('Song not found.');
  //   }

  //   // Check if the current user is the owner of the song
  //   // Check if the current user is the owner of the song
  //   if (song.uploadedBy.id !== userId) {
  //     // Access uploadedBy.id
  //     throw new ForbiddenException(
  //       'You are not authorized to create a split sheet for this song',
  //     );
  //   }
  //   // Get the service charge percentage from the configuration
  //   const serviceChargePercentage =
  //     this.configService.get<number>('splits.serviceChargePercentage') || 0.15;

  //   // Validate the split entries
  //   this.validateEntries(entries, serviceChargePercentage);

  //   // Create a new split sheet entity and associate it with the song
  //   const splitSheet = this.splitSheetRepository.create({ song });

  //   // Create split sheet entries for each collaborator
  //   splitSheet.entries = await Promise.all(
  //     entries.map(async (entryData) => {
  //       const entry = new SplitSheetEntry();
  //       entry.recipientEmail = entryData.recipientEmail;

  //       // Check if the collaborator is an existing user
  //       const user = await this.userRepository.findOne({
  //         where: { email: entryData.recipientEmail },
  //       });
  //       if (user) {
  //         entry.userId = user.id;
  //         entry.user = user;
  //         entry.status = SplitEntryStatus.ACTIVE;
  //       } else {
  //         entry.status = SplitEntryStatus.PENDING;
  //       }

  //       // Check for duplicate split entries
  //       const existingEntry = await this.splitEntryRepository.findOne({
  //         where: {
  //           splitSheet: { id: splitSheet.id }, // Use splitSheet.id instead of splitSheetId
  //           recipientEmail: entryData.recipientEmail,
  //         },
  //       });
  //       if (existingEntry) {
  //         throw new HttpException(
  //           'Duplicate split entry found.',
  //           HttpStatus.BAD_REQUEST,
  //         );
  //       }

  //       entry.percentage = new Decimal(entryData.percentage).toNumber();

  //       // Generate a claim link for the split entry
  //       const claimLink = await this.generateClaimLink(entry.id);

  //       const recipientName = entryData.recipientName || 'Contributor';

  //       // Send a notification email to the collaborator
  //       await this.emailService.sendSplitNotification(
  //         entry.recipientEmail,
  //         claimLink,
  //         recipientName,
  //       );

  //       return entry;
  //     }),
  //   );

  //   // Create a split sheet entry for the platform's service fee
  //   const platformFeeEntry = new SplitSheetEntry();
  //   platformFeeEntry.recipientEmail = 'Platform Service Fee';
  //   platformFeeEntry.percentage = serviceChargePercentage;
  //   platformFeeEntry.status = SplitEntryStatus.PENDING;

  //   splitSheet.entries.push(platformFeeEntry);

  //   // Save the split sheet and its entries to the database
  //   return await this.splitSheetRepository.save(splitSheet);
  // }

  // New create splitsheet function
  async createSplitSheet(
    createSplitSheetDto: CreateSplitSheetDto,
    userId: string,
  ): Promise<SplitSheet> {
    const { songId, entries } = createSplitSheetDto;

    // Check if a split sheet already exists for the song
    const existingSplitSheet = await this.splitSheetRepository.findOne({
      where: { song: { id: songId } },
    });
    if (existingSplitSheet) {
      throw new HttpException(
        'A split sheet already exists for this song. Please update the existing split sheet.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const song = await this.songRepository.findOne({
      where: { id: songId },
      relations: ['uploadedBy'], // Ensure uploadedBy is loaded
    });
    if (!song) {
      throw new BadRequestException('Song not found.');
    }

    // Check if the current user is the owner of the song
    if (song.uploadedBy.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to create a split sheet for this song',
      );
    }

    // Get the service charge percentage from the configuration
    const serviceChargePercentage = this.configService.get<number>(
      'splits.serviceChargePercentage',
    );

    try {
      // Validate the split entries - Now properly handling validation errors
      this.validateEntries(entries, serviceChargePercentage);
    } catch (validationError) {
      throw new BadRequestException(validationError.message);
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
      throw new BadRequestException(
        `Total percentage must equal 100%. Current total: ${totalPercentage + platformShare}%`,
      );
    }

    // Create a new split sheet entity and associate it with the song
    const splitSheet = this.splitSheetRepository.create({ song });

    // Save the split sheet first to get an ID
    const savedSplitSheet = await this.splitSheetRepository.save(splitSheet);

    // Check for duplicate email entries before creating them
    const emailsSet = new Set<string>();
    for (const entry of entries) {
      if (emailsSet.has(entry.recipientEmail)) {
        throw new BadRequestException(
          `Duplicate recipient email: ${entry.recipientEmail}`,
        );
      }
      emailsSet.add(entry.recipientEmail);
    }

    // Create split sheet entries for each collaborator
    const entryPromises = entries.map(async (entryData) => {
      const entry = new SplitSheetEntry();
      entry.splitSheet = savedSplitSheet;
      entry.recipientEmail = entryData.recipientEmail;
      entry.percentage = new Decimal(entryData.percentage).toNumber();

      // Default status is PENDING
      entry.status = SplitEntryStatus.PENDING;

      // Check if the collaborator is an existing user
      const user = await this.userRepository.findOne({
        where: { email: entryData.recipientEmail },
      });

      if (user) {
        entry.userId = user.id;
        entry.user = user;
        // Even if user exists, they still need to accept the split
      }

      // Save the entry
      const savedEntry = await this.splitEntryRepository.save(entry);

      // Generate a claim link for the split entry using the saved entry's ID
      const claimLink = await this.generateClaimLink(savedEntry.id);

      const recipientName = entryData.recipientName || 'Contributor';

      // Send a notification email to the collaborator
      await this.emailService.sendSplitNotification(
        entry.recipientEmail,
        claimLink,
        recipientName,
      );

      return savedEntry;
    });

    // Create a split sheet entry for the platform's service fee
    const platformFeeEntry = new SplitSheetEntry();
    platformFeeEntry.splitSheet = savedSplitSheet;
    platformFeeEntry.recipientEmail = 'Platform Service Fee';
    platformFeeEntry.percentage = platformShare;
    platformFeeEntry.status = SplitEntryStatus.ACTIVE; // Platform fee is automatically active

    // Execute all entry creation promises in parallel
    const createdEntries = await Promise.all([
      ...entryPromises,
      this.splitEntryRepository.save(platformFeeEntry),
    ]);

    // Update the split sheet with the created entries
    savedSplitSheet.entries = createdEntries;

    // Return the complete split sheet with all entries
    return this.splitSheetRepository.findOne({
      where: { id: savedSplitSheet.id },
      relations: ['entries', 'song'],
    });
  }

  //Endof new splitsheet create function
  // Validate the split entries to ensure the total percentage does not exceed the allowed limit
  private validateEntries(
    entries: CreateSplitSheetDto['entries'],
    serviceChargePercentage: number,
  ) {
    // Calculate the platform's percentage share
    const platformPercentage = new Decimal(serviceChargePercentage)
      .times(100)
      .toNumber(); // Convert to percentage

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

  // Generate a claim link for a split entry
  private async generateClaimLink(entryId: string): Promise<string> {
    const encryptedId = await this.encryptEntryId(entryId);
    return `${this.configService.get('app.frontendDomain')}/splits/claim/${encryptedId}`;
  }

  // Encrypt a split entry ID (implementation not shown)
  private async encryptEntryId(entryId: string): Promise<string> {
    // Implement your encryption logic here
    return 'encrypted:' + entryId;
  }

  // Decrypt a split entry ID (implementation not shown)
  private async decryptEntryId(encryptedId: string): Promise<string> {
    // Implement your decryption logic here
    return encryptedId.replace('encrypted:', '');
  }

  // Allow a user to claim a split entry
  async claimSplitEntry(
    encryptedEntryId: string,
    userId: string,
  ): Promise<SplitSheetEntry> {
    const entryId = await this.decryptEntryId(encryptedEntryId);

    // Find the split entry by ID
    const entry = await this.splitEntryRepository.findOne({
      where: { id: entryId },
      relations: ['user'],
    });
    if (!entry) {
      throw new NotFoundException('Split entry not found.');
    }

    // Check if the split entry has already been claimed by another user
    if (entry.userId && entry.userId !== userId) {
      throw new BadRequestException(
        'Split entry already claimed by another user.',
      );
    }

    // Find the user by ID
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Ensure the user has completed their profile before claiming the split
    if (!user.name || !user.payoutMethods) {
      throw new BadRequestException(
        'Please complete your profile to claim this split.',
      );
    }

    entry.userId = userId;
    entry.user = user;
    entry.status = SplitEntryStatus.ACTIVE;

    // Save the updated split entry to the database
    return await this.splitEntryRepository.save(entry);
  }

  // Get a split sheet by ID, including its associated song and entries
  async getSplitSheet(splitSheetId: string): Promise<SplitSheet> {
    const splitSheet = await this.splitSheetRepository.findOne({
      where: { id: splitSheetId },
      relations: ['song', 'entries'],
    });

    if (!splitSheet) {
      throw new NotFoundException('Split sheet not found.');
    }

    return splitSheet;
  }

  // Update an existing split sheet
  async updateSplitSheet(
    splitSheetId: string,
    updateSplitSheetDto: UpdateSplitSheetDto,
    userId: string,
  ): Promise<SplitSheet> {
    const { entries } = updateSplitSheetDto;

    // Get the split sheet and its associated song
    const splitSheet = await this.splitSheetRepository.findOne({
      where: { id: splitSheetId },
      relations: ['song', 'song.uploadedBy'], // Load the song and its owner
    });
    if (!splitSheet) {
      throw new NotFoundException('Split sheet not found.');
    }

    // Check if the current user is the owner of the song
    if (splitSheet.song.uploadedBy.id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this split sheet',
      );
    }

    // Get the service charge percentage from the configuration
    const serviceChargePercentage = this.configService.get<number>(
      'splits.serviceChargePercentage',
    );

    // Validate the updated split entries
    this.validateEntries(entries, serviceChargePercentage);

    // Update the split sheet entries
    splitSheet.entries = await Promise.all(
      entries.map(async (entryData) => {
        // Use.find() to locate existing entries by ID
        let entry = splitSheet.entries.find((e) => e.id === entryData.id);

        if (entry) {
          // Update the properties of the existing entry
          entry.recipientEmail = entryData.recipientEmail;
          entry.percentage = new Decimal(entryData.percentage).toNumber();
        } else {
          // Create a new SplitSheetEntry entity using create()
          entry = this.splitEntryRepository.create({
            recipientEmail: entryData.recipientEmail,
            percentage: new Decimal(entryData.percentage).toNumber(),
            splitSheet: splitSheet, // Associate with the split sheet
          });

          // Check if the collaborator is an existing user
          const user = await this.userRepository.findOne({
            where: { email: entryData.recipientEmail },
          });
          if (user) {
            entry.userId = user.id;
            entry.user = user;
            entry.status = SplitEntryStatus.ACTIVE;
          } else {
            entry.status = SplitEntryStatus.PENDING;
          }
        }

        return entry; // Return the SplitSheetEntry entity
      }),
    );

    // Find the platform fee entry, or create one if it doesn't exist
    let platformFeeEntry = splitSheet.entries.find(
      (e) => e.recipientEmail === 'Platform Service Fee',
    );
    if (platformFeeEntry) {
      platformFeeEntry.percentage = serviceChargePercentage;
    } else {
      platformFeeEntry = this.splitEntryRepository.create({
        // Use create() here as well
        recipientEmail: 'Platform Service Fee',
        percentage: serviceChargePercentage,
        status: SplitEntryStatus.PENDING,
        splitSheet: splitSheet, // Associate with the split sheet
      });
      splitSheet.entries.push(platformFeeEntry);
    }

    // Save the updated split sheet and its entries to the database
    return await this.splitSheetRepository.save(splitSheet);
  }

  // Get all split entries for a specific user
  async getUserSplits(userId: string): Promise<SplitSheetEntry[]> {
    return await this.splitEntryRepository.find({
      where: { userId: userId }, // Make sure this is a string
      relations: ['splitSheet', 'splitSheet.song'],
    });
  }

  // Get all split entries for a specific split sheet
  async getSplitSheetEntries(splitSheetId: string): Promise<SplitSheetEntry[]> {
    const entries = await this.splitEntryRepository.find({
      where: { splitSheetId: splitSheetId }, // Make sure this is a string
      relations: ['splitSheet', 'user'],
    });
    return entries;
  }

  // Find all split entries associated with a specific email address
  async findAllSplitsByEmail(email: string): Promise<SplitSheetEntry[]> {
    return await this.splitEntryRepository.find({
      where: { recipientEmail: email },
      relations: ['splitSheet', 'splitSheet.song'],
    });
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
}
