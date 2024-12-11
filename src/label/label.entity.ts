// src/labels/entities/label.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Artist } from 'src/artists/entities/artist.entity';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  labelName: string;

  @Column()
  legalEntityName: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column('simple-array')
  genres: string[];

  @Column('jsonb')
  socialMediaLinks: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    website?: string;
  };

  @Column({ nullable: true })
  website: string;

  @Column('jsonb')
  contactInformation: {
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };

  // Business-specific fields
  @Column({ nullable: true })
  taxId: string;

  @Column({ nullable: true })
  businessRegistrationNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.labels)
  user: User;

  @OneToMany(() => Artist, (artist) => artist.label)
  artistRoster: Artist[];
}
