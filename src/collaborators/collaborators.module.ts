//
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratorController } from './collaborators.controller';
import { CollaboratorService } from './collaborators.service';
import { Collaborator } from './entities/collaborator.entity';
import { AuthModule } from '../auth/auth.module';
import { SongsModule } from '../songs/songs.module'; // Need this for SongOwnerGuard
import { SplitSheetService } from './splitsheet.service';
import { SplitSheetController } from './splitsheet.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator]),
    AuthModule, // Global module for auth
    SongsModule, // For SongOwnerGuard and Song entity
  ],
  providers: [CollaboratorService, SplitSheetService],
  controllers: [CollaboratorController, SplitSheetController],
  exports: [CollaboratorService, SplitSheetService],
})
export class CollaboratorsModule {}
