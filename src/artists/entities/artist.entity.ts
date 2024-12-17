// src/artists/entities/artist.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
// import { User } from 'src/users/user.entity';
// import { Song } from '../../songs/entities/song.entity';
// import { Label } from 'src/label/label.entity';
// Remove direct Song import
import type { Song } from '../../songs/entities/song.entity'; // Use type import
import type { User } from '../../users/user.entity';
import type { Label } from '../../label/label.entity';

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

  // @ManyToOne(() => User, (user) => user.artistProfiles)
  // user: User;

  // @OneToMany(() => Song, (song) => song.artist)
  // songs: Song[];

  // @OneToMany('Song', 'artist') // Use string literal for Song
  // songs: Song[];

  // @ManyToOne(() => Label, (label) => label.artistRoster, {
  //   eager: false,
  // })
  // label: Label;
  // Relationships using string literals for circular dependencies
  @ManyToOne('User', 'artistProfiles')
  user: User;

  @OneToMany('Song', 'artist')
  songs: Song[];

  @ManyToOne('Label', 'artistRoster', {
    eager: false,
  })
  label: Label;
}
