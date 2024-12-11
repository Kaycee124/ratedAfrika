// src/artists/entities/artist.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Song } from '../../songs/entities/song.entity';
import { Label } from 'src/label/label.entity';

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  stageName: string;

  @Column()
  legalName: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column('simple-array')
  genres: string[];

  @Column('jsonb')
  socialMediaLinks: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    spotify?: string;
  };

  @Column({ nullable: true })
  website: string;

  @Column()
  email: string;

  @Column('jsonb')
  paymentInformation: {
    type: string;
    details: Record<string, any>;
  };
  //relationships

  @ManyToOne(() => User, (user) => user.artistProfiles)
  user: User;

  @OneToMany(() => Song, (song) => song.artist)
  songs: Song[];

  @ManyToOne(() => Label, (label) => label.artistRoster, {
    eager: false,
  })
  label: Label;
}
