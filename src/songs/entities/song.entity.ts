// src/songs/entities/song.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  // OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinTable,
  ManyToMany,
  JoinColumn,
  OneToMany,
  // OneToMany,
} from 'typeorm';
import { Artist } from '../../artists/entities/artist.entity';
// import type { SongCollaborator } from '../../collaborators/entities/collaborator.entity';
import type { SplitSheet } from 'src/collaborators/entities/splitsheet.entity';
import { ReleaseContainer } from './album.entity';
import type { User } from 'src/users/user.entity';
import { TempArtist } from 'src/artists/entities/temp-artist.entity';
import { Collaborator } from '../../collaborators/entities/collaborator.entity';

export enum ReleaseType {
  SINGLE = 'SINGLE',
  ALBUM = 'ALBUM',
  EP = 'EP',
}

export enum SongStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  TAKEN_DOWN = 'TAKEN_DOWN',
}

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic Information
  @Column()
  title: string;

  @Column({ type: 'enum', enum: ReleaseType })
  releaseType: ReleaseType;

  @Column()
  releaseLanguage: string;

  @Column()
  label: string;

  @Column()
  primaryGenre: string;

  @Column('simple-array', { nullable: true })
  secondaryGenres: string[];

  @Column()
  recordingYear: number;

  @Column({ default: false })
  isExplicit: boolean;

  @Column({ nullable: true })
  isrc: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Media Files
  @Column()
  coverArtId: string;

  @Column()
  masterTrackId: string;

  @Column('jsonb', { nullable: true })
  mixVersions: {
    versionLabel: string;
    fileId: string;
  }[];

  @Column('jsonb', { nullable: true })
  previewClip: {
    fileId: string;
    startTime: number;
    endTime: number;
  };

  @Column('jsonb', { nullable: true })
  musicVideo: {
    url: string;
    thumbnailId?: string;
  };

  // Release & Distribution

  @Column({ type: 'timestamp', nullable: true })
  originalReleaseDate: Date;

  @Column({ type: 'timestamp' })
  proposedReleaseDate: Date;

  @Column()
  releaseTime: string;

  @Column({ default: false })
  isPreOrder: boolean;

  @Column({ type: 'timestamp', nullable: true })
  preOrderDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  trackPrice: number;

  @Column('simple-array')
  targetStores: string[];

  @Column('simple-array')
  targetCountries: string[];

  // Status and Tracking
  @Column({
    type: 'enum',
    enum: SongStatus,
    default: SongStatus.DRAFT,
  })
  status: SongStatus;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relationships
  @ManyToOne(() => Artist, (artist) => artist.songs)
  primaryArtist: Artist;

  @ManyToMany(() => Artist)
  @JoinTable({
    name: 'song_featured_artists', // **Unique Name**
    joinColumn: { name: 'song_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'artist_id', referencedColumnName: 'id' },
  })
  featuredPlatformArtists: Artist[];

  @ManyToMany(() => TempArtist)
  @JoinTable({
    name: 'song_featured_temp_artists', // **Unique Name**
    joinColumn: { name: 'song_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'temp_artist_id', referencedColumnName: 'id' },
  })
  featuredTempArtists: TempArtist[];

  @OneToMany('Collaborator', (collaborator: Collaborator) => collaborator.song)
  collaborators: Collaborator[];

  // Current active splitsheet (for clean queries)
  @Column({ type: 'uuid', nullable: true })
  currentSplitSheetId: string;

  @ManyToOne('SplitSheet', { nullable: true })
  @JoinColumn({ name: 'currentSplitSheetId' })
  currentSplitSheet: SplitSheet;

  // All splitsheets for this song (for history/audit)
  @OneToMany('SplitSheet', 'song')
  splitsHistory: SplitSheet[];

  // Add these new fields to your existing Song entity
  @Column({ nullable: true })
  releaseContainerId: string; // Optional EP/Album ID reference

  @Column({ nullable: true })
  trackNumber: number;

  // Relationship to ReleaseContainer
  @ManyToOne('ReleaseContainer', (container: ReleaseContainer) => container.tracks)
  @JoinColumn({ name: 'releaseContainerId' })
  releaseContainer: ReleaseContainer;

  @Column({ nullable: true })
  uploadedById: string;

  @ManyToOne('User', 'songs') // Use string literal for relationship
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;
}
