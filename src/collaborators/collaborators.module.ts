//
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratorController } from './collaborators.controller';
import {
  CollaboratorService,
  SongCollaboratorService,
} from './collaborators.service';
import { Collaborator, SongCollaborator } from './entities/collaborator.entity';
import { AuthModule } from '../auth/auth.module';
import { SongsModule } from '../songs/songs.module'; // Need this for SongOwnerGuard

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator, SongCollaborator]),
    AuthModule, // Global module for auth
    SongsModule, // For SongOwnerGuard and Song entity
  ],
  providers: [CollaboratorService, SongCollaboratorService],
  controllers: [CollaboratorController],
  exports: [CollaboratorService, SongCollaboratorService],
})
export class CollaboratorsModule {}
