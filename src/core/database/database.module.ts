// src/infrastructure/database/database.module.ts
// why is this failing lawd
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as entities from '../database/entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASS'),
        database: configService.get('DATABASE_NAME'),
        entities: Object.values(entities),
        // ssl: {
        //   rejectUnauthorized: false,
        // },
        ssl: false,
        synchronize: false,
        logging: configService.get('NODE_ENV') !== 'production',
        pool: {
          min: 2,
          max: 10,
          idle: 10000,
        },
      }),
    }),
    // Register all entities once
    TypeOrmModule.forFeature(Object.values(entities)),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
