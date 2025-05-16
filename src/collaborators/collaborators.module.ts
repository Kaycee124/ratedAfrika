//
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratorController } from './collaborators.controller';
import { CollaboratorService } from './collaborators.service';
import { Collaborator } from './entities/collaborator.entity';
import { AuthModule } from '../auth/auth.module';
import { SplitSheetController } from './splitsheet.controller';
import { SplitSheetModule } from './splitsheet.module';
import { Song } from '../songs/entities/song.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator, Song]),
    AuthModule, // Global module for auth
    SplitSheetModule, // Import the SplitSheetModule
  ],
  providers: [CollaboratorService],
  controllers: [CollaboratorController, SplitSheetController],
  exports: [CollaboratorService],
})
export class CollaboratorsModule {}
