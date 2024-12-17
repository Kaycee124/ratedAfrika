// // src/songs/entities/song.entity.ts

// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   ManyToOne,
//   ManyToMany,
//   JoinTable,
// } from 'typeorm';
// import { User } from 'src/users/user.entity';
// import { Artist } from '../../artists/entities/artist.entity';
// import { Collaborator } from 'src/collaborators/entities/collaborator.entity';
// import { CollaboratorSplit } from 'src/collaborators/entities/collaborator-split.entity';

// // We'll define the status and types as enums for better type safety
// export enum SongStatus {
//   DRAFT = 'DRAFT',
//   PENDING_REVIEW = 'PENDING_REVIEW',
//   REVIEWED = 'REVIEWED',
//   SCHEDULED = 'SCHEDULED',
//   RELEASED = 'RELEASED',
//   TAKEN_DOWN = 'TAKEN_DOWN',
// }

// export enum SongType {
//   CLEAN = 'CLEAN',
//   EXPLICIT = 'EXPLICIT',
//   NOT_EXPLICIT = 'NOT_EXPLICIT',
// }

// @Entity('songs')
// export class Song {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   title: string;

//   @Column()
//   recordLabel: string;

//   @Column({ nullable: true })
//   trackMixVersion: string;

//   @Column()
//   duration: number;

//   @Column('int')
//   recordingYear: number;

//   @Column()
//   releaseLanguage: string;

//   @Column({ nullable: true })
//   previewClip: string; // File path for preview audio clip

//   @Column({ default: false })
//   isExplicit: boolean;

//   @Column({ default: false })
//   isReviewed: boolean;

//   @Column('date', { nullable: true })
//   releaseDate: Date;

//   @Column('text')
//   genre: string;

//   @Column()
//   ISRC: string;

//   // One-to-one relationship for track artist (the primary owner of the song)
//   @ManyToOne(() => Artist, { nullable: false })
//   trackArtist: Artist;

//   // Many-to-many relationship for featured artists (additional artists involved in the song)
//   @ManyToMany(() => Artist)
//   @JoinTable({
//     name: 'song_featured_artists',
//     joinColumn: { name: 'song_id', referencedColumnName: 'id' },
//     inverseJoinColumn: { name: 'artist_id', referencedColumnName: 'id' },
//   })
//   featuredArtists: Artist[];

//   // One-to-many relationship for contributors (e.g., writers, producers) with specific roles and split percentages
//   // @OneToMany(() => Contributor, (contributor) => contributor.song, { cascade: true })
//   // contributors: Contributor[];

//   @Column('float', { default: 0 })
//   servicePercentage: number; // Service fee percentage deduction

//   @Column('float', { nullable: true })
//   userSplitPercentage: number; // User-defined royalty split

//   @Column({ nullable: true })
//   coverImage: string; // Path for the cover image

//   @ManyToOne(() => User)
//   uploadedBy: User;
// }
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
// import { Artist } from '../../artists/entities/artist.entity';
// import { Lyrics } from '../../lyrics/entities/lyrics.entity';
// Remove direct import of Lyrics
import type { Lyrics } from '../../lyrics/entities/lyrics.entity'; // Use type import
import type { Artist } from '../../artists/entities/artist.entity'; // Use type import

export enum SongType {
  CLEAN = 'clean',
  EXPLICIT = 'explicit',
  NOT_EXPLICIT = 'not_explicit',
}

export enum SongStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  READY_FOR_DISTRIBUTION = 'ready_for_distribution',
  DISTRIBUTED = 'distributed',
}

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SongType,
    default: SongType.NOT_EXPLICIT,
  })
  songType: SongType;

  @Column('simple-array')
  genres: string[];

  @Column({ nullable: true })
  isrc: string;

  @Column({ type: 'int' })
  recordingYear: number;

  @Column()
  releaseLanguage: string;

  @Column({ nullable: true })
  previewClipStartTime: number;

  @Column({ nullable: true })
  previewClipEndTime: number;

  @Column('jsonb', { nullable: true })
  audioFiles: {
    originalFile: string;
    mixVersions?: { version: string; file: string }[];
    previewClip?: string;
  };

  @Column({ nullable: true })
  coverImage: string;

  @Column('jsonb', { nullable: true })
  musicVideo: {
    url: string;
    thumbnail?: string;
  };

  @Column('jsonb')
  royaltySplits: {
    artistShare: number;
    contributorShares: { contributorId: string; share: number }[];
    writerShares: { writerId: string; share: number }[];
    labelShare?: number;
    serviceShare: number;
  };

  @Column({ type: 'timestamp', nullable: true })
  proposedReleaseDate: Date;

  @Column({ type: 'time', nullable: true })
  proposedReleaseTime: string;

  @Column({ default: false })
  isPreOrder: boolean;

  @Column({ type: 'timestamp', nullable: true })
  preOrderDate: Date;

  @Column('simple-array')
  targetStores: string[];

  @Column('simple-array')
  targetCountries: string[];

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

  // // Relationships
  // @ManyToOne(() => Artist, (artist) => artist.songs)
  // artist: Artist;

  // @OneToMany(() => Lyrics, (lyrics) => lyrics.song)
  // lyrics: Lyrics[];
  @OneToMany('Lyrics', 'song') // Use string literal for Lyrics
  lyrics: Lyrics[];

  @ManyToOne('Artist', 'songs') // Use string literal for Artist
  artist: Artist;
}
