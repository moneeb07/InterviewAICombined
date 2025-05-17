import mongoose, { Schema } from 'mongoose';
import { IJob, RoundType } from '../types/Job';

const jobSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  role: { type: String, required: true },
  framework: { type: [String], required: true, default: [] },
  roundTypes: { 
    type: [{ 
      type: String, 
      enum: Object.values(RoundType) 
    }], 
    required: true, 
    default: [] 
  },
  deadline: { type: Date, required: true },
  company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true }
});

export const Job = mongoose.model<IJob>('Job', jobSchema);
