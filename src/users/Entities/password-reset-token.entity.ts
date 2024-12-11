import {
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
    Entity,
  } from 'typeorm';
  import { User } from '../user.entity';

  @Entity ('password_reset_token')
  export class PasswordReset {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne('User', 'passwordResets', { onDelete: 'CASCADE' })
    user: User;
  
    // @Column({ unique: true })
    // @Index()
    // token: string;

    @Column()
    resetCode: string;
  
    @Column()
    expiresAt: Date;
  
    @Column({ default: false })
    isUsed: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  