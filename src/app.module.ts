import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SongsModule } from './songs/songs.module';
import { ArtistsModule } from './artists/artists.module';
import { LabelsModule } from './label/label.module';
import { CollaboratorsModule } from './collaborators/collaborators.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { RatedFansModule } from './ratedfans/ratedfans.module';

// Infrastructure Modules
import { DatabaseModule } from 'src/core/database/database.module';
import { SharedModule } from './core/shared/shared.module';

// Configuration
import {
  appConfig,
  authConfig,
  dbConfig,
  mailerConfig,
} from 'src/config/app.config';
import { googleOAuthConfig } from './config/google-oauth.config';
import { StorageModule } from './storage/storage.module';
import spotifyOauth from './config/spotify-oauth';

@Module({
  imports: [
    // Configuration setup
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        appConfig,
        authConfig,
        dbConfig,
        mailerConfig,
        googleOAuthConfig,
        spotifyOauth,
      ],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 60,
      },
    ]),

    // Infrastructure Modules
    DatabaseModule, // Global database configuration
    SharedModule, // Global shared services

    // Feature Modules
    AuthModule,
    UsersModule,
    SongsModule,
    ArtistsModule,
    LabelsModule,
    CollaboratorsModule,
    LyricsModule,
    StorageModule,
    RatedFansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
