// interfaces/IPasswordReset.ts
import { IUser } from './IUser';

export interface IPasswordReset {
  id: string;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  user: IUser;
}
