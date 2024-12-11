import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../user.entity';

@Entity()
export class Otp {
  @PrimaryGeneratedColumn()
  id: number;

 // Use an inline function to reference `User` directly
 @ManyToOne('User', 'otps', { onDelete: 'CASCADE' })
 user: User;

  @Column()
  code: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;


}