import { Song } from 'src/songs/entities/song.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

// Enums
export enum CollaboratorRole {
  MIX_ENGINEER = 'm&m',
  PRODUCER = 'producer',
  WRITER = 'writer',
  FEATURED = 'featured',
}

// Base collaborator information
@Entity('collaborators')
export class Collaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  hasPublishedMusic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}

// Individual song contributions
@Entity('song_collaborators')
export class SongCollaborator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  songId: string;

  @Column('uuid')
  collaboratorId: string;

  @Column({
    type: 'enum',
    enum: CollaboratorRole,
  })
  role: CollaboratorRole;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  splitPercentage: number;

  @ManyToOne(() => Collaborator)
  @JoinColumn({ name: 'collaboratorId' })
  collaborator: Collaborator;

  @ManyToOne(() => Song, (song) => song.songCollaborators)
  @JoinColumn({ name: 'songId' })
  song: Song;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
