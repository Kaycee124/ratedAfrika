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
// import { Song } from '../../songs/entities/song.entity';
// Remove direct import of Song
import type { Song } from '../../songs/entities/song.entity'; // Use type import

@Entity('lyrics')
export class Lyrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  basicLyrics: string;

  @Column('jsonb', { default: [] })
  synchronizedLyrics: {
    timestamp: number;
    text: string;
  }[];

  @Column()
  songId: string;

  // @ManyToOne(() => Song)
  // song: Song;
  @ManyToOne('Song', 'lyrics') // Use string literal for Song
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
