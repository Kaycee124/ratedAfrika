import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
  } from 'typeorm';
import { User } from '../user.entity';
  
  @Entity('email_verification_tokens')
  export class EmailVerificationToken {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne('User', 'emailVerificationTokens', { onDelete: 'CASCADE' })
    user: User;
  
  
    @Column({ unique: true })
    @Index()
    token: string;
  
    @Column()
    expiresAt: Date;
  
    @Column({ default: false })
    isUsed: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  