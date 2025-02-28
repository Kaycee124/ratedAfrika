import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { SplitSheet } from 'src/collaborators/entities/splitsheet.entity';

export enum SplitEntryStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  PAID = 'Paid',
}

@Entity('split_sheet_entries')
export class SplitSheetEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SplitSheet, (sheet) => sheet.entries)
  @JoinColumn({ name: 'splitSheetId' }) // Specify the foreign key column name
  splitSheet: SplitSheet;

  @Column()
  splitSheetId: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  recipientEmail: string;

  @Column({ unique: true }) // Ensure claim tokens are unique
  claimToken: string;

  @Column('decimal', { precision: 5, scale: 2 }) // Adjust precision and scale as needed
  percentage: number;

  @Column({
    type: 'enum',
    enum: SplitEntryStatus,
    default: SplitEntryStatus.PENDING,
  })
  status: SplitEntryStatus;
}
