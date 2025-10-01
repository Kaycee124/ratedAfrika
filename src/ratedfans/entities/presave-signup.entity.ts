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
import { StreamingPlatform } from './ratedfans-link.entity';

export enum PresaveStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('presave_signups')
@Index('idx_presave_signups_page_email', ['pageId', 'email'], { unique: true })
@Index('idx_presave_signups_status', ['status'])
@Index('idx_presave_signups_platform', ['platform'])
export class PresaveSignup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pageId: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: StreamingPlatform,
  })
  platform: StreamingPlatform;

  @Column({
    type: 'enum',
    enum: PresaveStatus,
    default: PresaveStatus.PENDING,
  })
  status: PresaveStatus;

  @Column({ nullable: true })
  confirmationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  notifiedAt: Date;

  @Column('jsonb', { nullable: true })
  metadata: {
    userAgent?: string;
    ip?: string;
    referer?: string;
    source?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne('RatedFansPage', 'presaveSignups', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pageId' })
  page: RatedFansPage;
}
