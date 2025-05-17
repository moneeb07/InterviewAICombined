/**
 * Simple in-memory store to track request-response cycles
 */
export class RequestTracker {
  private static instance: RequestTracker;
  private requestMap: Map<string, RequestData> = new Map();

  private constructor() {}

  public static getInstance(): RequestTracker {
    if (!RequestTracker.instance) {
      RequestTracker.instance = new RequestTracker();
    }
    return RequestTracker.instance;
  }

  /**
   * Start tracking a new request
   */
  public trackRequest(requestId: string, data: RequestData): void {
    this.requestMap.set(requestId, {
      ...data,
      startTime: Date.now(),
      logs: [],
      completed: false
    });
  }

  /**
   * Add a log entry to a request
   */
  public addLog(requestId: string, log: LogEntry): void {
    const request = this.requestMap.get(requestId);
    if (request) {
      request.logs.push(log);
    }
  }

  /**
   * Mark a request as completed and return the full request data
   */
  public completeRequest(requestId: string, responseData: any): RequestData | undefined {
    const request = this.requestMap.get(requestId);
    if (request) {
      request.completed = true;
      request.response = responseData;
      request.endTime = Date.now();
      request.duration = request.endTime - request.startTime;
      
      // Return the complete request data
      return request;
    }
    return undefined;
  }

  /**
   * Get a request by ID
   */
  public getRequest(requestId: string): RequestData | undefined {
    return this.requestMap.get(requestId);
  }

  /**
   * Clean up old completed requests (call periodically)
   */
  public cleanup(maxAgeMs: number = 3600000): void {
    const now = Date.now();
    this.requestMap.forEach((data, id) => {
      if (data.completed && (now - data.endTime!) > maxAgeMs) {
        this.requestMap.delete(id);
      }
    });
  }
}

export interface RequestData {
  method: string;
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  logs: LogEntry[];
  completed: boolean;
  response?: any;
  error?: any;
}

export interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  data?: any;
} 