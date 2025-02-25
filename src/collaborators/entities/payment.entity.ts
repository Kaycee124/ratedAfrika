import { User } from 'src/users/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payout_methods')
export class PayoutMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.payoutMethods)
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ['paypal', 'bank', 'wire'],
  })
  type: string;

  @Column({ nullable: true })
  paypalEmail: string;

  // Bank transfer details
  @Column({ nullable: true })
  accountName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  routingNumber: string;

  @Column({ nullable: true })
  bankName: string;

  // Wire transfer details
  @Column({ nullable: true })
  swiftCode: string;

  @Column({ nullable: true })
  bankAddress: string;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
