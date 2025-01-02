// src/infrastructure/storage/entities/file-chunk.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { FileBase } from './file-base.entity';

@Entity('file_chunks')
export class FileChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  uploadId: string;

  @Column('int')
  chunkNumber: number;

  @Column('int')
  totalChunks: number;

  @Column()
  chunkSize: number;

  @Column()
  storageKey: string;

  @Column('jsonb', { nullable: true })
  metadata: {
    etag?: string;
    partNumber?: number;
    size?: number;
    checksum?: string;
  };

  @Column({ default: false })
  uploaded: boolean;

  @Column({ nullable: true })
  error: string;

  @ManyToOne(() => FileBase, { onDelete: 'CASCADE' })
  file: FileBase;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;
}
