// // import { Module } from '@nestjs/common';
// // import { AppController } from './app.controller';
// // import { AppService } from './app.service';
// // import { AuthModule } from './auth/auth.module';
// // import { UsersModule } from './users/users.module';
// // import { TypeOrmModule } from '@nestjs/typeorm';
// // import { ConfigModule } from '@nestjs/config';
// // import { datasource } from 'src/config/data-source';
// // import * as dotenv from 'dotenv';
// // import { ThrottlerModule } from '@nestjs/throttler';
// // import { SongsModule } from './songs/songs.module';
// // import { ArtistsModule } from './artists/artists.module';
// // import { LabelsModule } from './label/label.module';
// // import { CollaboratorsModule } from './collaborators/collaborators.module';
// // import { LyricsModule } from './lyrics/lyrics.module';

// // dotenv.config();

// // @Module({
// //   imports: [
// //     ThrottlerModule.forRoot([
// //       {
// //         ttl: 60000,
// //         limit: 10,
// //       },
// //     ]),
// //     ConfigModule.forRoot({ isGlobal: true }),
// //     TypeOrmModule.forRoot(datasource.options),
// //     AuthModule,
// //     UsersModule,
// //     SongsModule,
// //     ArtistsModule,
// //     LabelsModule,
// //     CollaboratorsModule,
// //     LyricsModule,
// //   ],
// //   controllers: [AppController],
// //   providers: [AppService],
// // })
// // export class AppModule {}

// /*
// {
//       // type: 'postgres',
//       // host: process.env.DATABASE_HOST,
//       // port: parseInt(process.env.DATABASE_PORT),
//       // username: process.env.DATABASE_USER,
//       // password: process.env.DATABASE_PASS,
//       // database: process.env.DATABASE_NAME,
//       // entities: [User],
//       // synchronize: true,  // Turn off in production
//       databaseConfig
//     }

//   */
// // 1. app.module.ts - Central configuration
// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ConfigModule } from '@nestjs/config';
// import { datasource } from 'src/config/data-source';
// import { ThrottlerModule } from '@nestjs/throttler';
// import { SongsModule } from './songs/songs.module';
// import { ArtistsModule } from './artists/artists.module';
// import { LabelsModule } from './label/label.module';
// import { CollaboratorsModule } from './collaborators/collaborators.module';
// import { LyricsModule } from './lyrics/lyrics.module';
// import {
//   appConfig,
//   authConfig,
//   dbConfig,
//   mailerConfig,
// } from 'src/config/app.config';
// import { googleOAuthConfig } from './config/google-oauth.config';
// import spotifyOauth from './config/spotify-oauth';

// @Module({
//   imports: [
//     // Global config setup
//     ConfigModule.forRoot({
//       isGlobal: true,
//       cache: true,
//       load: [
//         appConfig,
//         authConfig,
//         dbConfig,
//         mailerConfig,
//         googleOAuthConfig,
//         spotifyOauth,
//       ],
//     }),

//     ThrottlerModule.forRoot([
//       {
//         ttl: 60000,
//         limit: 10,
//       },
//     ]),

//     TypeOrmModule.forRoot(datasource.options),

//     // Feature modules
//     AuthModule,
//     UsersModule,
//     SongsModule,
//     ArtistsModule,
//     LabelsModule,
//     CollaboratorsModule,
//     LyricsModule,
//   ],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}

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
        ttl: 60000,
        limit: 10,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
