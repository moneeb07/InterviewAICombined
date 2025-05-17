import mongoose, { Schema } from 'mongoose';
import { IInterview } from '../types/Interview';
import { RoundType } from '../types/Job';

const roundSchema = new Schema({
  type: { 
    type: String, 
    enum: Object.values(RoundType),
    required: true
  },
  score: { type: Number, required: false },
  remarks: { type: String, required: false },
  status: { type: String, required: false, default: 'pending' },
  callId: { type: String, required: false },      // Vapi call ID for knowledge-based interviews
  transcript: { type: String, required: false }   // Transcript from the Vapi call
}, { _id: false });

const interviewSchema = new Schema({
  job_id: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cv_url: { type: String, required: false },
  parsed_cv: { type: String, required: false },
  rounds: { type: [roundSchema], required: true, default: [] },
  score: { type: Number, required: false },
  remarks: { type: String, required: false },
  status: { type: String, required: false, default: 'pending' }
});

export const Interview = mongoose.model<IInterview>('Interview', interviewSchema);