// src/lyrics/entities/lyrics.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  //   OneToMany,
  VersionColumn,
} from 'typeorm';
import { Song } from '../../songs/entities/song.entity';

@Entity('lyrics')
export class Lyrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  basicText: string;

  @Column('jsonb')
  synchronizedLyrics: {
    timestamp: number;
    text: string;
  }[];

  @Column()
  songId: string;

  @ManyToOne(() => Song)
  song: Song;

  @VersionColumn()
  version: number;

  @Column({ default: false })
  isComplete: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  createdBy: string;

  @Column()
  updatedBy: string;
}
