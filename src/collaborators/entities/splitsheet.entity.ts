import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Song } from '../../songs/entities/song.entity';
import type { SplitSheetEntry } from './splitsheetEntry.entity';

export enum SplitSheetStatus {
  ACTIVE = 'Active',
  PAID_OUT = 'PaidOut',
  ARCHIVED = 'Archived',
}

@Entity('split_sheets')
export class SplitSheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Song, (song) => song.splitsHistory)
  song: Song;

  @OneToMany('SplitSheetEntry', (entry: SplitSheetEntry) => entry.splitSheet)
  entries: SplitSheetEntry[];

  @Column({
    type: 'enum',
    enum: SplitSheetStatus,
    default: SplitSheetStatus.ACTIVE,
  })
  status: SplitSheetStatus;

  @Column({ nullable: true })
  paidOutAt?: Date;

  @Column({ nullable: true })
  lastModifiedBy?: string; // Who last modified this version

  // Versioning fields for the new update strategy
  @Column({ type: 'uuid', nullable: true })
  previousVersionId?: string; // Points to the previous version of this splitsheet

  @Column({ default: 1 })
  version: number; // Version number (1, 2, 3, etc.)

  @Column({ nullable: true })
  replacedAt?: Date; // When this version was replaced by a new one

  @Column({ nullable: true })
  replacedBy?: string; // User ID who created the replacement

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
