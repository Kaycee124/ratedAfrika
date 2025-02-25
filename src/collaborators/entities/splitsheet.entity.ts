import {
  Entity,
  PrimaryGeneratedColumn,
  //   Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Song } from '../../songs/entities/song.entity';
import { SplitSheetEntry } from './SplitSheetEntry.entity';

@Entity('split_sheets')
export class SplitSheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Song, (song) => song.splits)
  song: Song;

  @OneToMany('split_sheet_entries', 'splitSheet', {
    cascade: true, // This ensures entries are saved when the split sheet is saved
  })
  entries: SplitSheetEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
