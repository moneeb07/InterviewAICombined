import { IJob, Round } from "./Job";
import { Document } from "mongoose";
import { IUser } from "./User";

export interface IInterview extends Document {
  job_id: IJob['_id'];
  user_id: IUser['_id'];
  rounds: Round[];
  cv_url: string;
  parsed_cv: string;
  score: number;
  remarks: string;
  status: string;
}

/**
 * Interface for the final interview evaluation request to the AI service
 */
export interface FinalInterviewRequest {
  job_description: string;
  job_role: string;
  framework: string;
  parsed_cv: string;
  rounds: {
    type: string;
    score: number;
    remarks: string;
  }[];
}

/**
 * Interface for the final interview evaluation response from the AI service
 */
export interface FinalInterviewResponse {
  score: number;
  remarks: string;
}