import mongoose, { Schema } from 'mongoose';
import { IEmployee } from '../types/Employee';

const employeeSchema = new Schema({
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true }
});

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema); 