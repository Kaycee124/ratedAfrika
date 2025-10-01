import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import type { Artist } from '../../artists/entities/artist.entity';
import type { Song } from '../../songs/entities/song.entity';
import type { RatedFansLink } from './ratedfans-link.entity';
import type { PresaveSignup } from './presave-signup.entity';
import type { PromoCard } from './promo-card.entity';

export enum ReleaseType {
  SINGLE = 'Single',
  EP = 'EP',
  ALBUM = 'Album',
  MIXTAPE = 'Mixtape',
  LIVE = 'Live',
  REMIX = 'Remix',
}

@Entity('ratedfans_pages')
@Index('idx_ratedfans_pages_slug', ['slug'], { unique: true })
@Index('idx_ratedfans_pages_artist_song', ['artistId', 'songId'])
@Index('idx_ratedfans_pages_published', ['isPublished'])
export class RatedFansPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column()
  releaseTitle: string; // 2024-09-22: change: renamed from title for clarity

  @Column({ nullable: true })
  artistName: string; // 2024-12-28: change: added artist name field

  @Column()
  artistId: string;

  @Column({ nullable: true })
  songId: string; // 2024-12-28: change: made nullable for platform songs

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: false })
  isPresaveEnabled: boolean;

  @Column({ type: 'timestamp', nullable: true })
  releaseDate: Date;

  @Column({
    type: 'enum',
    enum: ReleaseType, // ✅ Reference the actual enum
    nullable: true,
  })
  releaseType: ReleaseType; // 2024-09-22: change: added release type enum

  @Column({ type: 'jsonb', nullable: true })
  socialMediaLinks: {
    instagram?: string;
    tiktok?: string;
    x?: string;
    facebook?: string;
    youtube?: string;
    mail?: string;
  }; // 2024-09-22: change: page-specific social media with fallback

  @Column('jsonb', { nullable: true })
  previewClips: {
    title: string;
    url: string;
  }[]; // 2024-12-28: change: support multiple preview clips with titles

  @Column('jsonb', { nullable: true })
  coverArtLink: {
    url: string;
  }; // 2024-12-28: change: optional cover art link

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relationships
  @ManyToOne('Artist', { nullable: false })
  @JoinColumn({ name: 'artistId' })
  artist: Artist;

  @ManyToOne('Song', { nullable: true })
  @JoinColumn({ name: 'songId' })
  song: Song; // 2024-12-28: change: made nullable for platform songs

  @OneToMany('RatedFansLink', 'page')
  links: RatedFansLink[];

  @OneToMany('PresaveSignup', 'page')
  presaveSignups: PresaveSignup[];

  @OneToMany('PromoCard', 'page')
  promoCards: PromoCard[];
}
