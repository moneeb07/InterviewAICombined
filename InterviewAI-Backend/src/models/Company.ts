import mongoose, { Schema } from 'mongoose';
import { ICompany } from '../types/Company';

const companySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  owner_id: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export const Company = mongoose.model<ICompany>('Company', companySchema);
  