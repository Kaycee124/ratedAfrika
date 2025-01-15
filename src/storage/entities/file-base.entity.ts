// src/infrastructure/storage/entities/file-base.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  BeforeInsert,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { v4 as uuidv4 } from 'uuid';

export enum FileStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETE = 'complete',
  FAILED = 'failed',
  DELETED = 'deleted',
}

export enum FileValidationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PASSED = 'passed',
  FAILED = 'failed',
}

@Entity('files')
export abstract class FileBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  originalFilename: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number;

  @Column()
  path: string;

  @Column()
  bucket: string;

  @Column()
  key: string;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  status: FileStatus;

  @Column({
    type: 'enum',
    enum: FileValidationStatus,
    default: FileValidationStatus.PENDING,
  })
  validationStatus: FileValidationStatus;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('jsonb', { nullable: true })
  validationResults: Record<string, any>;

  @Column('jsonb', { nullable: true })
  processingResults: Record<string, any>;

  @Column({ default: false })
  isPublic: boolean;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ nullable: true })
  lastAccessedAt?: Date;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ unique: true })
  storageKey: string;

  @BeforeInsert()
  generateStorageKey() {
    this.storageKey = `${this.bucket}/${uuidv4()}-${this.originalFilename}`;
  }
}
