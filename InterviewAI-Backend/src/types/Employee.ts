import { Document } from 'mongoose';
import { ICompany } from './Company';
import { IUser } from './User';

export interface IEmployee extends Document {
  company_id: ICompany['_id'];
  user_id: IUser['_id'];
  role: string;
} 