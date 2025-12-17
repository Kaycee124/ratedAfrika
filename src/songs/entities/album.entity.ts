// src/songs/entities/release-container.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Song } from './song.entity';
import { Artist } from '../../artists/entities/artist.entity';
import type { User } from 'src/users/user.entity';
import { TempArtist } from 'src/artists/entities/temp-artist.entity';

export enum ReleaseContainerType {
  EP = 'EP',
  ALBUM = 'ALBUM',
}

export enum ReleaseContainerStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

@Entity('release_containers')
export class ReleaseContainer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: ReleaseContainerType })
  type: ReleaseContainerType;

  @Column()
  releaseLanguage: string;

  @Column()
  primaryGenre: string;

  @Column('simple-array', { nullable: true })
  secondaryGenres: string[];

  @Column()
  recordingYear: number;

  @Column({ nullable: true })
  upc: string;

  @Column({ nullable: true })
  catalogNumber: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  totalTracks: number;

  @Column({ default: 0 })
  uploadedTracks: number;

  @Column({ nullable: true })
  lastUploadedTrackNumber: number;

  @Column({ nullable: true })
  completedAt: Date;

  @Column()
  label: string;

  @Column()
  coverArtId: string;

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
  price: number;

  @Column('simple-array')
  targetStores: string[];

  @Column('simple-array')
  targetCountries: string[];

  @Column({
    type: 'enum',
    enum: ReleaseContainerStatus,
    default: ReleaseContainerStatus.DRAFT,
  })
  status: ReleaseContainerStatus;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @OneToMany('Song', (song: Song) => song.releaseContainer)
  tracks: Song[];

  @ManyToOne('Artist')
  primaryArtist: Artist;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @Column({ nullable: true })
  uploadedById: string;

  @ManyToOne('User', 'releaseContainers') // Use string literal for relationship
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @ManyToMany(() => Artist)
  @JoinTable({
    name: 'release_container_featured_artists',
    joinColumn: { name: 'container_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'artist_id', referencedColumnName: 'id' },
  })
  featuredPlatformArtists: Artist[];

  @ManyToMany(() => TempArtist)
  @JoinTable({
    name: 'release_container_featured_temp_artists',
    joinColumn: { name: 'container_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'temp_artist_id', referencedColumnName: 'id' },
  })
  featuredTempArtists: TempArtist[];

  @Column({ default: false })
  isExplicit: boolean;
}
