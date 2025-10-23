import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Services
import { RatedFansService } from './services/ratedfans.service';
import { LinkResolverService } from './services/link-resolver.service';
import { PresaveService } from './services/presave.service';
import { PresaveReminderService } from './services/presave-reminder.service';

// Controllers
import { RatedFansPublicController } from './controllers/ratedfans-public.controller';
import { RatedFansDashboardController } from './controllers/ratedfans-dashboard.controller';
import { RatedFansSlugController } from './controllers/ratedfans-slug.controller'; // 2025-01-22 23:48: Added direct /:slug endpoint controller

// External modules
import { DatabaseModule } from '../core/database/database.module';
import { StorageModule } from '../storage/storage.module';
import { SongsModule } from '../songs/songs.module'; // 2024-09-22: change: import for cover art resolution
import { SharedModule } from '../core/shared/shared.module'; // For EmailService

@Module({
  imports: [
    ConfigModule,
    DatabaseModule, // Provides all entities via central configuration
    StorageModule,
    SongsModule, // 2024-09-22: change: needed for SongsService injection
    SharedModule, // For EmailService
    ScheduleModule.forRoot(), // 2024-12-28: Added for presave reminder jobs
  ],
  controllers: [
    RatedFansPublicController,
    RatedFansDashboardController,
    RatedFansSlugController, // 2025-01-22 23:48: Added direct /:slug endpoint controller
  ],
  providers: [
    RatedFansService,
    LinkResolverService,
    PresaveService,
    PresaveReminderService, // 2024-12-28: Added presave reminder service
  ],
  exports: [
    RatedFansService,
    LinkResolverService,
    PresaveService,
    PresaveReminderService,
  ],
})
export class RatedFansModule {}
