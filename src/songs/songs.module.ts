import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from 'src/core/database/database.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    AuthModule, // For authentication guards
    DatabaseModule, // For database-related configurations and entity registrations
    StorageModule, // For file storage operations
  ],
  controllers: [SongsController],
  providers: [SongsService],
  exports: [SongsService], // Allow other modules to use SongsService if needed
})
export class SongsModule {}
