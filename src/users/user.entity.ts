import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Otp } from './Entities/otp.entity';
import { PasswordReset } from './Entities/password-reset-token.entity';
import { EmailVerificationToken } from './Entities/email-verification.entity';
// import { Artist } from 'src/artists/entities/artist.entity';
// import { Label } from 'src/label/label.entity';
import type { Label } from '../label/label.entity';
import type { Artist } from '../artists/entities/artist.entity';
import type { Song } from 'src/songs/entities/song.entity';
import type { ReleaseContainer } from '../songs/entities/album.entity';
// Remove direct imports and use type imports for circular dependencies
export enum UserRole {
  ADMIN = 'admin',
  ARTIST = 'artist',
  NORMAL = 'normal',
}

export enum Sub_Plans {
  ARTIST = 'artist',
  LABEL = 'label',
  FREE = 'free',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true }) //when working on this project, this allows oauth users login. do not remove without alt setup
  password: string;

  @Column()
  name: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  emailVerificationTokenExpiration: Date;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true })
  resetTokenExpiration: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.NORMAL,
  })
  role: UserRole[];

  @Column({ nullable: true })
  profile: string;

  @Column({ type: 'text', nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  country?: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @Column({
    type: 'enum',
    enum: Sub_Plans,
    default: Sub_Plans.FREE,
  })
  subscription: Sub_Plans;

  @Column({ nullable: true })
  google_id: string;

  @Column({ nullable: true })
  spotify_id?: string;

  // Relationships
  @OneToMany('PasswordReset', 'user', { lazy: true })
  passwordResets: PasswordReset[];

  @OneToMany('EmailVerificationToken', 'user', { lazy: true })
  emailVerificationTokens: EmailVerificationToken[];

  @OneToMany('Otp', 'user', { lazy: true })
  otps: Otp[];

  // @OneToMany('label', 'user', { lazy: true })
  // labels: Label[];
  // @OneToMany(() => Label, (label) => label.user)
  // labels: Label[];

  // @OneToMany(() => Artist, (artist) => artist.user, {
  //   eager: false,
  //   cascade: true,
  // })
  // artistProfiles: Artist[];
  @OneToMany('Label', 'user')
  labels: Label[];

  @OneToMany('Artist', 'user', {
    eager: false,
    cascade: true,
  })
  artistProfiles: Artist[];

  @Column({ type: 'int', default: 0 })
  tokenVersion: number;

  @OneToMany('Song', 'uploadedBy') // Use string literal for relationship
  songs: Song[];

  @OneToMany('ReleaseContainer', 'uploadedBy') // Use string literal for relationship
  releaseContainers: ReleaseContainer[];
}

// {
//   sub: '105970907954516406569',
//   name: 'Benjamin Brawn',
//   given_name: 'Benjamin',
//   family_name: 'Brawn',
//   picture: 'https://lh3.googleusercontent.com/a/ACg8ocKcEzXXUkda2zaOWAA6r-UchUsKqTgzlD8bLWmwYXQNBnBqLQ=s96-c',
//   email: 'benbrawn15@gmail.com',
//   email_verified: true
// }
