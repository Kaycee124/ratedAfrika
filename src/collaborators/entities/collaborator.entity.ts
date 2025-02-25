// import { Song } from 'src/songs/entities/song.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { User } from 'src/users/user.entity';
// Enums
export enum CollaboratorRole {
  MIX_ENGINEER = 'engineer',
  PRODUCER = 'producer',
  SONG_WRITER = 'writer',
}

// Base collaborator information
@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  role: CollaboratorRole;

  @Column({ nullable: true }) // New: Spotify URL
  spotifyUrl?: string;

  @Column({ nullable: true }) // New: Apple Music URL
  appleUrl?: string;

  @Column({ nullable: true }) // New: YouTube URL
  youtubeUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne('users', 'collaborators')
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @Column({ nullable: true })
  createdByUserId: string;
}
