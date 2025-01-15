import { DataSource } from 'typeorm';
import { User } from '../users/user.entity'; // Ensure correct relative path
import { PasswordReset } from 'src/users/Entities/password-reset-token.entity';
import { EmailVerificationToken } from 'src/users/Entities/email-verification.entity';
import { Otp } from 'src/users/Entities/otp.entity';
import { Label } from 'src/label/label.entity';
import { Artist } from 'src/artists/entities/artist.entity';
import { Collaborator } from 'src/collaborators/entities/collaborator.entity';
import { CollaboratorSplit } from 'src/collaborators/entities/collaborator-split.entity';
import { Lyrics } from 'src/lyrics/entities/lyrics.entity';
import { Song } from 'src/songs/entities/song.entity';
import { FileBase } from 'src/storage/entities/file-base.entity';
import { AudioFile } from 'src/storage/entities/audio-file.entity';
import { ImageFile } from 'src/storage/entities/image-file.entity';
import { VideoFile } from 'src/storage/entities/video-file.entity';
import { FileChunk } from 'src/storage/entities/file-chunk.entity';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const datasource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT, 10),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE_NAME,
  entities: [
    User,
    PasswordReset,
    EmailVerificationToken,
    Otp,
    Label,
    Artist,
    Collaborator,
    Lyrics,
    Song,
    Collaborator,
    CollaboratorSplit,
    FileBase,
    FileChunk,
    AudioFile,
    ImageFile,
    VideoFile,
  ],
  migrations: ['src/migration/*.ts'],
  synchronize: false,
});
