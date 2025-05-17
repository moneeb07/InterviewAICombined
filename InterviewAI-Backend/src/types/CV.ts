import { Document } from 'mongoose';

export interface CVUploadRequest {
  interviewId: string;
  cvBase64: string;
}

export interface CVResponse {
  interviewId: string;
  cvUrl: string;
  parsedCv: string | null;
}

export interface AIParseCVRequest {
  cv_url: string;
}

export interface AIParseCVResponse {
  parsed_markdown: string;
} 