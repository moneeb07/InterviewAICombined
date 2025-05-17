import { Document } from 'mongoose';
import { IUser } from './User';

export interface ICompany extends Document {
  name: string;
  description?: string;
  owner_id: IUser['_id'];
}