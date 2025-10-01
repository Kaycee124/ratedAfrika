import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import type { RatedFansPage } from './ratedfans-page.entity';

// 2024-12-28: Updated platform names to match requirements
export enum StreamingPlatform {
  SPOTIFY = 'spotify',
  APPLE_MUSIC = 'appleMusic',
  YOUTUBE_MUSIC = 'youtubeMusic',
  DEEZER = 'deezer',
  TIDAL = 'tidal',
  AUDIOMACK = 'audiomack',
  IHEART_RADIO = 'iHeartRadio',
  AMAZON_MUSIC = 'amazonMusic',
  ITUNES = 'iTunes',
  VEVO = 'vevo',
}

@Entity('ratedfans_links')
@Index('idx_ratedfans_links_page_platform', ['pageId', 'platform'], {
  unique: true,
})
@Index('idx_ratedfans_links_active', ['isActive'])
export class RatedFansLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pageId: string;

  @Column({
    type: 'enum',
    enum: StreamingPlatform,
  })
  platform: StreamingPlatform;

  @Column()
  url: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ nullable: true })
  displayOrder: number;

  @Column({ type: 'timestamp', nullable: true })
  releaseDate: Date; // 2024-12-28: change: added release date for presave functionality

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('RatedFansPage', 'links', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page: RatedFansPage;
}
