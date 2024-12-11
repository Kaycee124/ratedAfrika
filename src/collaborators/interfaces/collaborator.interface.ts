import { CollaboratorType } from './collaborator-type.enum';

export interface ICollaborator {
  id: string;
  name: string;
  email: string;
  type: CollaboratorType;
  artistId?: string;
  taxId: string;
  paymentInfo: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
