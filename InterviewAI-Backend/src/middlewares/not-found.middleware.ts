import { Request, Response, NextFunction } from 'express';
import { logWarning } from '../utils/logger.util';
import { NOT_FOUND_MESSAGE } from '../constants/messages';
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logWarning(`Route not found: ${req.method} ${req.originalUrl}`, 'NotFound');
  
  res.status(404).json({
    statusCode: 404,
    message: NOT_FOUND_MESSAGE,
    error: NOT_FOUND_MESSAGE
  });
}; 