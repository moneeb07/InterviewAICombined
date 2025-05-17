import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    emailVerified: boolean;
    [key: string]: any;
  };
  session?: {
    id: string;
    [key: string]: any;
  };
}
/**
 * Middleware to protect routes - verifies user is authenticated
 */
export const requireAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get the session using better-auth API
    const sessionResult = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });

    if (!sessionResult) {
      return res.status(401).json({ message: 'Unauthorized: No session found' });
    }

    // Attach user and session to request for use in route handlers
    req.user = sessionResult.user;
    req.user._id = req.user.id
    req.session = sessionResult.session;

    console.log("req.user", req.user)
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthorized: Session validation failed' });
  }
};

/**
 * Optional auth middleware - doesn't deny access but attaches user if authenticated
 */
export const optionalAuth = async (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Get the session using better-auth API
    const sessionResult = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    console.log("I came inside the optional auth")
    if (sessionResult) {
      // Attach user and session to request for use in route handlers
      req.user = sessionResult.user;
      req.session = sessionResult.session;
    }
    
    next();
  } catch (error) {
    // Just continue without authentication in case of error
    next();
  }
}; 