// interfaces/IOtp.ts
import { IUser } from './IUser';

export interface IOtp {
  id: number;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  user: IUser;
}
