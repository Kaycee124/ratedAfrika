import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SplitSheet } from './entities/splitsheet.entity';
import { SplitSheetEntry } from './entities/splitsheetEntry.entity';
import { SplitSheetService } from './splitsheet.service';
import { Song } from 'src/songs/entities/song.entity';
import { User } from 'src/users/user.entity';
import { EmailService } from 'src/auth/services/email.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SplitSheet, SplitSheetEntry, Song, User]),
    ConfigModule,
    AuthModule,
  ],
  providers: [SplitSheetService, EmailService],
  exports: [SplitSheetService],
})
export class SplitSheetModule {}
