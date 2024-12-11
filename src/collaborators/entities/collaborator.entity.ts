// src/collaborators/entities/collaborator.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CollaboratorType } from '../interfaces/collaborator-type.enum';
import { CollaboratorSplit } from './collaborator-split.entity';

@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: CollaboratorType,
  })
  type: CollaboratorType;

  @Column({ nullable: true })
  artistId?: string;

  @Column()
  taxId: string;

  @Column({ type: 'jsonb' })
  paymentInfo: string;

  @Column({ default: false })
  isVerified: boolean;

  // Define the relationship with explicit type
  @OneToMany(() => CollaboratorSplit, (split) => split.collaborator, {
    eager: false,
    cascade: true,
  })
  splits: CollaboratorSplit[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
