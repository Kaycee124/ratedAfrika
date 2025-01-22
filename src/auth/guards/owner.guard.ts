// src/songs/guards/owner.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song } from 'src/songs/entities/song.entity';
import { ReleaseContainer } from 'src/songs/entities/album.entity';

@Injectable()
export class SongOwnerGuard implements CanActivate {
  private readonly logger = new Logger(SongOwnerGuard.name);

  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.user; // From JWT auth guard
      const songId = request.params.songId || request.params.id;

      // Validate inputs
      if (!user?.id || !songId) {
        this.logger.warn('Missing user ID or song ID in request');
        throw new ForbiddenException('Invalid request parameters');
      }

      // Find the song with relations
      const song = await this.songRepository.findOne({
        where: { id: songId },
        select: ['id', 'uploadedById', 'status'],
      });

      if (!song) {
        this.logger.warn(`Song with ID ${songId} not found`);
        throw new NotFoundException('Song not found');
      }

      // Verify ownership
      const isOwner = song.uploadedById === user.id;

      if (!isOwner) {
        this.logger.warn(
          `User ${user.id} attempted unauthorized access to song ${songId}`,
        );
        throw new ForbiddenException(
          'You do not have permission to modify this song',
        );
      }

      this.logger.debug(
        `User ${user.id} authorized as owner for song ${songId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error in SongOwnerGuard: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

@Injectable()
export class ReleaseContainerOwnerGuard implements CanActivate {
  private readonly logger = new Logger(ReleaseContainerOwnerGuard.name);

  constructor(
    @InjectRepository(ReleaseContainer)
    private readonly releaseContainerRepository: Repository<ReleaseContainer>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const user = request.user; // From JWT auth guard
      const containerId = request.params.id || request.params.containerId;

      // Validate inputs
      if (!user?.id || !containerId) {
        this.logger.warn('Missing user ID or release container ID in request');
        throw new ForbiddenException('Invalid request parameters');
      }

      // Find the release container with relations
      const container = await this.releaseContainerRepository.findOne({
        where: { id: containerId },
        select: ['id', 'uploadedById', 'status'],
      });

      if (!container) {
        this.logger.warn(`Release container with ID ${containerId} not found`);
        throw new NotFoundException('Release container not found');
      }

      // Verify ownership
      const isOwner = container.uploadedById === user.id;
      if (!isOwner) {
        this.logger.warn(
          `User ${user.id} attempted unauthorized access to release container ${containerId}`,
        );
        throw new ForbiddenException(
          'You do not have permission to modify this release container',
        );
      }

      this.logger.debug(
        `User ${user.id} authorized as owner for release container ${containerId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error in ReleaseContainerOwnerGuard: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
