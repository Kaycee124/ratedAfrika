// // src/collaborators/entities/collaborator.entity.ts
// import {
//   Column,
//   CreateDateColumn,
//   Entity,
//   OneToMany,
//   PrimaryGeneratedColumn,
//   UpdateDateColumn,
// } from 'typeorm';
// import { CollaboratorType } from '../interfaces/collaborator-type.enum';
// import { CollaboratorSplit } from './collaborator-split.entity';

// @Entity('collaborators')
// export class Collaborator {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column()
//   name: string;

//   @Column({ unique: true })
//   email: string;

//   @Column({
//     type: 'enum',
//     enum: CollaboratorType,
//   })
//   type: CollaboratorType;

//   @Column({ nullable: true })
//   artistId?: string;

//   @Column()
//   taxId: string;

//   @Column({ type: 'jsonb' })
//   paymentInfo: string;

//   @Column({ default: false })
//   isVerified: boolean;

//   // Define the relationship with explicit type
//   @OneToMany(() => CollaboratorSplit, (split) => split.collaborator, {
//     eager: false,
//     cascade: true,
//   })
//   splits: CollaboratorSplit[];

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }

// src/collaborators/entities/collaborator.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { CollaboratorType } from '../types/collaborator-types';
// import { CollaboratorSplit } from './collaborator-split.entity';
// Use type import for circular dependency
import type { CollaboratorSplit } from './collaborator-split.entity';

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
  paymentInfo: Record<string, any>;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // @OneToMany(() => CollaboratorSplit, (split) => split.collaborator)
  // splits: CollaboratorSplit[];
  @OneToMany('CollaboratorSplit', 'collaborator')
  splits: CollaboratorSplit[];
}
