// // src/infrastructure/storage/storage.module.ts
// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// // import { TypeOrmModule } from '@nestjs/typeorm';
// import { StorageService } from './services/storage.service';
// import { FileValidationService } from './services/file-validation.service';
// import { S3StorageProvider } from './providers/s3-storage.provider';
// import { LocalStorageProvider } from './providers/local-storage.provider';
// // import { FileBase } from './entities/file-base.entity';
// // import { AudioFile } from './entities/audio-file.entity';
// // import { ImageFile } from './entities/image-file.entity';
// // import { VideoFile } from './entities/video-file.entity';
// // import { FileChunk } from './entities/file-chunk.entity';
// import { StorageController } from './storage.controller';

// @Module({
//   imports: [
//     ConfigModule,
//     // TypeOrmModule.forFeature([
//     //   FileBase,
//     //   AudioFile,
//     //   ImageFile,
//     //   VideoFile,
//     //   FileChunk,
//     // ]),
//   ],
//   controllers: [StorageController],
//   providers: [
//     StorageService,
//     FileValidationService,
//     {
//       provide: 'STORAGE_PROVIDER',
//       useFactory: (configService: ConfigService) => {
//         const storageType = configService.get('STORAGE_TYPE', 'local');

//         if (storageType === 's3') {
//           const s3Provider = new S3StorageProvider();
//           s3Provider.initialize({
//             bucket: configService.get('AWS_BUCKET_NAME'),
//             region: configService.get('AWS_REGION'),
//             accessKey: configService.get('AWS_ACCESS_KEY'),
//             secretKey: configService.get('AWS_SECRET_KEY'),
//           });
//           return s3Provider;
//         }

//         const localProvider = new LocalStorageProvider();
//         localProvider.initialize({
//           bucket: 'local',
//           basePath: configService.get('LOCAL_STORAGE_PATH', './uploads'),
//         });
//         return localProvider;
//       },
//       inject: [ConfigService],
//     },
//   ],
//   exports: [StorageService, FileValidationService],
// })
// export class StorageModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './services/storage.service';
import { FileValidationService } from './services/file-validation.service';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { StorageController, PublicStorageController } from './storage.controller';
import { multerOptions, MULTER_CONFIG_TOKEN } from './config/multer.config';
import { FileBase } from './entities/file-base.entity';
import { AudioFile } from './entities/audio-file.entity';
import { ImageFile } from './entities/image-file.entity';
import { VideoFile } from './entities/video-file.entity';
import { FileChunk } from './entities/file-chunk.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      FileBase,
      AudioFile,
      ImageFile,
      VideoFile,
      FileChunk,
    ]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ...multerOptions,
        dest: configService.get('UPLOAD_DESTINATION', './uploads'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [StorageController, PublicStorageController],
  providers: [
    StorageService,
    FileValidationService,
    {
      provide: MULTER_CONFIG_TOKEN,
      useValue: multerOptions,
    },
    {
      provide: 'STORAGE_PROVIDER',
      useFactory: async (configService: ConfigService) => {
        const storageType = configService.get('STORAGE_TYPE', 'local');
        try {
          if (storageType === 's3') {
            const s3Provider = new S3StorageProvider();
            await s3Provider.initialize({
              bucket: configService.get('AWS_BUCKET_NAME'),
              region: configService.get('AWS_REGION'),
              accessKey: configService.get('AWS_ACCESS_KEY'),
              secretKey: configService.get('AWS_SECRET_KEY'),
            });
            return s3Provider;
          } else {
            const localProvider = new LocalStorageProvider();
            await localProvider.initialize({
              bucket: 'local',
              basePath: configService.get('LOCAL_STORAGE_PATH', './uploads'),
            });
            return localProvider;
          }
        } catch (error) {
          throw new Error(
            `Failed to initialize storage provider: ${error.message}`,
          );
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [StorageService, FileValidationService],
})
export class StorageModule {}
