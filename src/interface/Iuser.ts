// interfaces/IUser.ts
import { UserRole, Sub_Plans } from 'src/users/user.entity';
import { IPasswordReset } from './Ipassreset';
import { IEmailVerificationToken } from './IemailToekn';
import { IOtp } from './IOtp';

export interface IUser {
  id: string;
  email: string;
  password?: string;
  name: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiration?: Date;
  resetToken?: string;
  resetTokenExpiration?: Date;
  isActive: boolean;
  role: UserRole[];
  profile?: string;
  image?: string;
  created_at: Date;
  updated_at: Date;
  subscription: Sub_Plans;
  google_id?: string;
  passwordResets?: IPasswordReset[];
  emailVerificationTokens?: IEmailVerificationToken[];
  otps?: IOtp[];
  tokenVersion: number;
}
