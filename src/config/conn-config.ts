import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  migrations: [__dirname + '/../migrations/*.{js,ts}'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
};
