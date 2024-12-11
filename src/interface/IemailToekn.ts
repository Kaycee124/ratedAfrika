// interfaces/IEmailVerificationToken.ts
import { IUser } from './IUser';

export interface IEmailVerificationToken {
  id: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  user: IUser;
}
