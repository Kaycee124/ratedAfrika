import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CollaboratorController,
  CollaboratorSearchController,
} from './collaborators.controller';
import { CollaboratorService } from './collaborators.service';
import { Collaborator } from './entities/collaborator.entity';
import { AuthModule } from '../auth/auth.module';
import { SplitSheetController } from './splitsheet.controller';
import { SplitSheetModule } from './splitsheet.module';
import { Song } from '../songs/entities/song.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator, Song]),
    AuthModule,
    SplitSheetModule,
  ],
  providers: [CollaboratorService],
  controllers: [
    CollaboratorController,
    CollaboratorSearchController,
    SplitSheetController,
  ],
  exports: [CollaboratorService],
})
export class CollaboratorsModule {}
