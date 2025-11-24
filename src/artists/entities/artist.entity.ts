import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import type { User } from '../../users/user.entity';
import type { Song } from '../../songs/entities/song.entity';
import type { Label } from '../../label/label.entity';

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  country: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  website: string;

  @Column('simple-array')
  genres: string[];

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column('jsonb')
  musicPlatforms: {
    spotify?: string;
    appleMusic?: string;
    amazonMusic?: string;
    deezer?: string;
    audiomack?: string;
    tidal?: string;
    youtube?: string;
  };

  @Column('jsonb')
  socialMediaLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    x?: string;
  };

  // Relationships using string literals to avoid circular dependencies
  @ManyToOne('User', 'artistProfiles')
  user: User;

  @OneToMany('Song', 'primaryArtist')
  songs: Song[];

  @ManyToOne('Label', 'artistRoster', {
    eager: false,
  })
  label: Label;
}
