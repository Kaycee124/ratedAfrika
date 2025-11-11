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
import { Song } from 'src/songs/entities/song.entity';
import type { User } from 'src/users/user.entity';

//NEW CHANGE: Enums for Collaborator Role
export enum CollaboratorRole {
  PRODUCER = 'Producer',
  WRITER = 'Writer',
  COMPOSER = 'Composer',
  LYRICIST = 'Lyricist',
  MIX_ENGINEER = 'Mix Engineer',
  MASTERING_ENGINEER = 'Mastering Engineer',
  FEATURED_ARTIST = 'Featured Artist',
  REMIXER = 'Remixer',
  MUSICIAN = 'Musician',
  ARRANGER = 'Arranger',
  // Add other DDEX high-level roles as needed (This is useful for searching for collaborators by role)
  OTHER = 'Other',
}

// Base collaborator information
@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Link to the song this credit is for
  @Column()
  songId: string;

  @ManyToOne('Song', (song: Song) => song.collaborators, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'songId' })
  song: Song;

  // Collaborator information
  @Column()
  name: string;

  @Column() // No longer unique - same person can work on multiple songs
  email: string;

  // Role is now a flexible string (not enum)
  @Column({
    type: 'enum',
    enum: CollaboratorRole,
  })
  role: CollaboratorRole;

  // credit display name ( What shall we display on the credit Page)
  @Column({ nullable: true })
  creditedAs: string; // e.g., "Producer", "Executive Producer", "Mix Engineer", "Co-Writer"

  @Column({ nullable: true })
  spotifyUrl?: string;

  @Column({ nullable: true })
  appleUrl?: string;

  @Column({ nullable: true })
  youtubeUrl?: string;

  // Display order for credits
  @Column({ type: 'int', nullable: true })
  displayOrder?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @ManyToOne('User', 'collaborators')
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @Column({ nullable: true })
  createdByUserId: string;
}
