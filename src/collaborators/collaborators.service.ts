import { Injectable, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator, CollaboratorRole } from './entities/collaborator.entity';
import {
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from './dto/collaborator.dto';
import { Song } from 'src/songs/entities/song.entity';

interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T | null;
}

@Injectable()
export class CollaboratorService {
  private readonly logger = new Logger(CollaboratorService.name);

  constructor(
    @InjectRepository(Collaborator)
    private readonly collaboratorRepository: Repository<Collaborator>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
  ) {}

  // Add a credit to a song
  async addSongCredit(
    createDto: CreateCollaboratorDto,
    songId: string,
    userId: string,
  ): Promise<ApiResponse<Collaborator>> {
    // 1. Validate that the song exists
    const song = await this.songRepository.findOne({
      where: { id: songId },
    });
    if (!song) {
      throw new HttpException(
        'This song does not exist on our platform',
        HttpStatus.NOT_FOUND,
      );
    }
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    // 2. Validate that the user is the owner of the song
    if (song.uploadedById !== userId) {
      throw new HttpException(
        'You do not have permission to add a credit to this song',
        HttpStatus.FORBIDDEN,
      );
    }
    //can only add a credit to a song if the user is the owner of the song

    const credit = this.collaboratorRepository.create({
      ...createDto,
      songId: songId,
      role: createDto.role,
      creditedAs: createDto.creditedAs || createDto.role, // Default to enum value if not provided
      createdByUserId: userId,
    });

    const savedCredit = await this.collaboratorRepository.save(credit);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Song credit added successfully',
      data: savedCredit,
    };
  }

  // Get all credits for a specific song
  async getSongCredits(songId: string): Promise<ApiResponse<Collaborator[]>> {
    const credits = await this.collaboratorRepository.find({
      where: { songId },
      relations: ['createdBy'],
      order: {
        displayOrder: 'ASC',
        createdAt: 'ASC',
      },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Song credits retrieved successfully',
      data: credits,
    };
  }

  // Get credits filtered by role for a song
  async getSongCreditsByRole(
    songId: string,
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    role: CollaboratorRole, // Use the enum for searching
  ): Promise<ApiResponse<Collaborator[]>> {
    const credits = await this.collaboratorRepository.find({
      where: { songId, role },
      relations: ['createdBy'],
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });

    return {
      statusCode: HttpStatus.OK,
      message: `${role} credits retrieved successfully`,
      data: credits,
    };
  }

  // Find a specific credit by ID
  async findOne(id: string): Promise<ApiResponse<Collaborator>> {
    const credit = await this.collaboratorRepository.findOne({
      where: { id },
      relations: ['createdBy', 'song'],
    });

    if (!credit) {
      throw new HttpException('Credit not found', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Credit retrieved successfully',
      data: credit,
    };
  }

  // Find all songs a person collaborated on (by email)
  async findCollaborationsByEmail(
    email: string,
  ): Promise<ApiResponse<Collaborator[]>> {
    const credits = await this.collaboratorRepository.find({
      where: { email },
      relations: ['song', 'createdBy'],
      order: { createdAt: 'DESC' },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Collaborations retrieved successfully',
      data: credits,
    };
  }

  // Update a specific credit
  async updateCredit(
    id: string,
    updateDto: UpdateCollaboratorDto,
    userId: string, // 1. Pass in user ID for security check
  ): Promise<ApiResponse<Collaborator>> {
    // 2. Find the credit and load its related song

    const credit = await this.collaboratorRepository.findOne({
      where: { id },
      //NEW CHANGE : November 11, 2025 at 07:30 AM
      relations: ['song'],
    });

    if (!credit) {
      throw new HttpException('Credit not found', HttpStatus.NOT_FOUND);
    }

    if (credit.song.uploadedById !== userId) {
      //NEW CHANGE : November 11, 2025 at 07:30 AM
      throw new HttpException(
        'You do not have permission to update this credit',
        HttpStatus.FORBIDDEN,
      );
      //NEW CHANGE : November 11, 2025 at 07:30 AM
    }

    Object.assign(credit, updateDto);
    const updatedCredit = await this.collaboratorRepository.save(credit);

    return {
      statusCode: HttpStatus.OK,
      message: 'Credit updated successfully',
      data: updatedCredit,
    };
  }

  // Delete a credit
  async removeCredit(
    id: string,
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    userId: string, // 1. Pass in user ID for security check
  ): Promise<ApiResponse> {
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    // 2. Find the credit and load its related song
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    const credit = await this.collaboratorRepository.findOne({
      where: { id },
      //NEW CHANGE : November 11, 2025 at 07:30 AM
      relations: ['song'],
    });

    if (!credit) {
      throw new HttpException('Credit not found', HttpStatus.NOT_FOUND);
    }

    //NEW CHANGE : November 11, 2025 at 07:30 AM
    // 3. Verify Ownership
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    if (credit.song.uploadedById !== userId) {
      //NEW CHANGE : November 11, 2025 at 07:30 AM
      throw new HttpException(
        'You do not have permission to remove this credit',
        HttpStatus.FORBIDDEN,
      );
      //NEW CHANGE : November 11, 2025 at 07:30 AM
    }

    await this.collaboratorRepository.softDelete(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Credit removed successfully',
    };
  }

  // Get all credits created by a specific user (across all songs)
  async findCreditsByUser(
    userId: string,
  ): Promise<ApiResponse<Collaborator[]>> {
    const credits = await this.collaboratorRepository.find({
      where: { createdByUserId: userId },
      relations: ['song', 'createdBy'],
      order: { createdAt: 'DESC' },
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Credits retrieved successfully',
      data: credits,
    };
  }
}
