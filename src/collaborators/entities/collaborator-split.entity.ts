// src/collaborators/entities/collaborator-split.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
// import { Collaborator } from './collaborator.entity';
import { SplitType } from '../types/collaborator-types';
// Use type import for circular dependency
import type { Collaborator } from './collaborator.entity';

@Entity('collaborator_splits')
export class CollaboratorSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  collaboratorId: string;

  // @ManyToOne(() => Collaborator, (collaborator) => collaborator.splits, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'collaboratorId' })
  // collaborator: Collaborator;
  @ManyToOne('Collaborator', 'splits', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'collaboratorId' })
  collaborator: Collaborator;

  @Column('uuid')
  songId: string;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  percentage: number;

  @Column({
    type: 'enum',
    enum: SplitType,
  })
  splitType: SplitType;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  // Added verifiedAt column
  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
