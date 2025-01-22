import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('temp_artists')
export class TempArtist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: false })
  hasStreamingPresence: boolean;

  @Column({ nullable: true })
  spotifyUrl: string;

  @Column({ nullable: true })
  appleMusicUrl: string;

  @Column({ nullable: true })
  youtubeUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
