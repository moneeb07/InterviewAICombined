import { Request } from 'express';

// Custom request type with user property
export interface AuthenticatedRequest extends Request {
    user?: any;
    dummyUserId?: string;
}