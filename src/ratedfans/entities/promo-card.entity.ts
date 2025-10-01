import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import type { RatedFansPage } from './ratedfans-page.entity';

@Entity('promo_cards')
@Index('idx_promo_cards_page', ['pageId'])
export class PromoCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pageId: string;

  @Column()
  fileUrl: string;

  @Column()
  fileName: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    originalName?: string;
    description?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne('RatedFansPage', 'promoCards', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page: RatedFansPage;
}
