// src/collaborators/entities/collaborator-split.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Collaborator } from './collaborator.entity';
import { SplitType } from '../interfaces/collaborator-type.enum';

@Entity('collaborator_splits')
export class CollaboratorSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Define the relationship with explicit type
  @ManyToOne(() => Collaborator, (collaborator) => collaborator.splits, {
    onDelete: 'CASCADE',
  })
  collaborator: Collaborator;

  @Column('uuid')
  songId: string;

  @Column('decimal', { precision: 5, scale: 2 })
  percentage: number;

  @Column({
    type: 'enum',
    enum: SplitType,
  })
  splitType: SplitType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
