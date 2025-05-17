import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CustomLogger } from '../utils/custom-logger';
import { RequestTracker } from '../utils/request-tracker';
import onFinished from 'on-finished';
import { CLIENT_ERROR_LOG_LEVEL, DEBUG_LOG_LEVEL, SERVER_ERROR_LOG_LEVEL, SUCCESS_LOG_LEVEL } from '../constants/logger';
import { ERROR_MESSAGE } from '../constants/messages';
// Create a logger instance for HTTP requests
const httpLogger = new CustomLogger('HTTP');
const requestTracker = RequestTracker.getInstance();

/**
 * Get the appropriate color based on status code
 */
function getStatusColor(statusCode: number): string {
  if (statusCode >= 500) return SERVER_ERROR_LOG_LEVEL;
  if (statusCode >= 400) return CLIENT_ERROR_LOG_LEVEL;
  if (statusCode >= 300) return DEBUG_LOG_LEVEL;
  return SUCCESS_LOG_LEVEL;
}

// Middleware to log HTTP requests and responses
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  const startTime = Date.now();
  
  // Store requestId in request object for other middleware to access
  (req as any).requestId = requestId;
  
  // Extract relevant request information
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('user-agent') || 'unknown';
  
  // Safely extract body, query, and params
  const body = req.body || {};
  const query = req.query || {};
  const params = req.params || {};
  
  // Start tracking this request
  requestTracker.trackRequest(requestId, {
    method,
    url: originalUrl,
    startTime,
    logs: [],
    completed: false
  });
  
  // Log the incoming request
  httpLogger.log({
    message: `Incoming Request`,
    requestId,
    timestamp: new Date().toISOString(),
    method,
    url: originalUrl,
    ip,
    userAgent,
    body: Object.keys(body).length ? body : undefined,
    query: Object.keys(query).length ? query : undefined,
    params: Object.keys(params).length ? params : undefined,
  });

  // Store the original end method
  const originalEnd = res.end;
  let responseBody: any = null;

  // Override res.json to capture the response body
  const originalJson = res.json;
  res.json = function(body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // When the response is finished, log the response details
  onFinished(res, (err, res) => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
      // Determine log level based on status code
      const logLevel = getStatusColor(statusCode);
      
      const responseData = {
        message: `Outgoing Response`,
        requestId,
        timestamp: new Date().toISOString(),
        statusCode,
        responseTime: `${responseTime}ms`,
        responseSize: responseBody ? JSON.stringify(responseBody)?.length || 0 : 0,
        response: responseBody,
      };
      
      // Complete the request in the tracker
      requestTracker.completeRequest(requestId, responseBody);
      
      // Log with the appropriate level based on status code
      switch (logLevel) {
        case SERVER_ERROR_LOG_LEVEL:
          httpLogger.error(responseData);
          break;
        case CLIENT_ERROR_LOG_LEVEL:
          httpLogger.warn(responseData);
          break;
        case DEBUG_LOG_LEVEL:
          httpLogger.debug(responseData);
          break;
        case SUCCESS_LOG_LEVEL:
        default:
          httpLogger.log(responseData);
          break;
      }
  });

  // Clean up old requests periodically (every 100 requests)
  if (Math.random() < 0.01) {
    requestTracker.cleanup();
  }

  next();
};


export default loggingMiddleware;