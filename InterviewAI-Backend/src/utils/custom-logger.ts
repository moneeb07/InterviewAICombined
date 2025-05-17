import chalk from 'chalk';
import { RequestTracker } from './request-tracker';
import { LEVEL_LABELS, LEVEL_COLORS, BOX_WIDTH } from '../constants/logger';
export class CustomLogger {
  private context: string;
  private static readonly LEVEL_COLORS = LEVEL_COLORS;

  private static readonly BOX_WIDTH = BOX_WIDTH;

  private static readonly ENDING_LINE_WIDTH = this.BOX_WIDTH * 2;

  private static readonly LEVEL_LABELS = LEVEL_LABELS;

  private requestTracker: RequestTracker;

  constructor(context: string = 'System') {
    this.context = context;
    this.requestTracker = RequestTracker.getInstance();
  }

  log(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.prettyPrintObject('log', message);
    } else {
      console.log(
        CustomLogger.LEVEL_COLORS.log(`[${this.context}] ${message}`),
        ...optionalParams,
      );
    }
  }

  error(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.prettyPrintObject('error', message);
    } else {
      console.error(
        CustomLogger.LEVEL_COLORS.error(`[${this.context}] ${message}`),
        ...optionalParams,
      );
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.prettyPrintObject('warn', message);
    } else {
      console.warn(
        CustomLogger.LEVEL_COLORS.warn(`[${this.context}] ${message}`),
        ...optionalParams,
      );
    }
  }

  debug(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.prettyPrintObject('debug', message);
    } else {
      console.debug(
        CustomLogger.LEVEL_COLORS.debug(`[${this.context}] ${message}`),
        ...optionalParams,
      );
    }
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (typeof message === 'object') {
      this.prettyPrintObject('verbose', message);
    } else {
      console.log(
        CustomLogger.LEVEL_COLORS.verbose(`[${this.context}] ${message}`),
        ...optionalParams,
      );
    }
  }

  private prettyPrintObject(level: keyof typeof CustomLogger.LEVEL_COLORS, obj: Record<string, any>) {
    const color = CustomLogger.LEVEL_COLORS[level];
    const timestamp = new Date().toISOString();
    
    // Extract message and requestId if they exist
    const { message, requestId, ...rest } = obj;
    
    // If this log is part of a request, add it to the request tracker
    if (requestId) {
      this.requestTracker.addLog(requestId, {
        timestamp: new Date(),
        level,
        message: message || 'Log Message',
        data: { ...rest }
      });
    }
    
    // Print header with timestamp, context, and message
    console.log(
      color(`[${timestamp}] [${this.context}] [${CustomLogger.LEVEL_LABELS[level]}] ${message || 'Log Message'}`),
    );
    
    // Print divider
    console.log(color('─'.repeat(80)));
    
    // Print the rest of the object properties
    if (level === 'error' && rest.error) {
      // Special handling for error objects
      console.log(color('Error:'), rest.error.message);
      console.log(color('Stack:'));
      console.log(chalk.gray(rest.error.stack));
      
      // Print other properties
      const { error, ...otherProps } = rest;
      if (Object.keys(otherProps).length) {
        console.log(color('Details:'));
        console.log(otherProps);
      }
    } else {
      // For non-error objects, print all properties
      Object.entries(rest).forEach(([key, value]) => {
        // Add type assertion or guard for value
        const typedValue = value as any;
        
        if (key === 'requestId') {
          console.log(color('RequestID:'), chalk.cyan(typedValue));
        } else if (key === 'statusCode') {
          const statusColor = 
            typedValue < 300 ? chalk.green :
            typedValue < 400 ? chalk.cyan :
            typedValue < 500 ? chalk.yellow :
            chalk.red;
          console.log(color('Status:'), statusColor(typedValue));
        } else if (key === 'responseTime') {
          const timeValue = parseInt(typedValue);
          const timeColor = 
            timeValue < 100 ? chalk.green :
            timeValue < 300 ? chalk.cyan :
            timeValue < 1000 ? chalk.yellow :
            chalk.red;
          console.log(color('Response Time:'), timeColor(typedValue));
        } else if (key === 'method') {
          const methodColor = 
            typedValue === 'GET' ? chalk.green :
            typedValue === 'POST' ? chalk.yellow :
            typedValue === 'PUT' ? chalk.blue :
            typedValue === 'DELETE' ? chalk.red :
            chalk.white;
          console.log(color('Method:'), methodColor(typedValue));
        } else if (key === 'url') {
          console.log(color('URL:'), chalk.cyan(typedValue));
        } else if (key === 'body' || key === 'query' || key === 'params' || key === 'response') {
          if (typedValue && typeof typedValue === 'object' && Object.keys(typedValue).length) {
            console.log(color(`${key.charAt(0).toUpperCase() + key.slice(1)}:`));
            console.log(typedValue);
          }
        } else {
          console.log(color(`${key.charAt(0).toUpperCase() + key.slice(1)}:`), typedValue);
        }
      });
    }
    
    // Print footer
    console.log(color('─'.repeat(80)));
    
    // If this is a response completion log, print the full request summary
    if (requestId && message === 'Outgoing Response') {
      this.printRequestSummary(requestId, level);
    }
  }
  
  /**
   * Print a summary of the entire request-response cycle
   */
  private printRequestSummary(requestId: string, level: keyof typeof CustomLogger.LEVEL_COLORS) {
    const request = this.requestTracker.completeRequest(requestId, null);
    if (!request) return;

    const boxWidth = CustomLogger.BOX_WIDTH;
    
    const color = CustomLogger.LEVEL_COLORS[level];
    
    console.log('\n');
    console.log(color('┌' + '─'.repeat(boxWidth - 2) + '┐'));
    
    // Center the title
    const title = ' REQUEST SUMMARY ';
    const padding = Math.floor((boxWidth - 2 - title.length) / 2);
    console.log(color('│' + ' '.repeat(padding) + title + ' '.repeat(boxWidth - 2 - padding - title.length) + '│'));
    
    console.log(color('├' + '─'.repeat(boxWidth - 2) + '┤'));
    
    // Truncate long values to fit in the box
    const truncate = (str: string, maxLength: number) => {
      if (str.length <= maxLength) return str.padEnd(maxLength);
      return str.substring(0, maxLength - 3) + '...';
    };
    
    // Calculate available space for values (accounting for label and formatting)
    const valueWidth = boxWidth - 15; // Adjust based on your longest label
    
    // Print request details with proper alignment
    console.log(color(`│ RequestID: ${truncate(requestId, valueWidth)} │`));
    console.log(color(`│ Method:    ${truncate(request.method, valueWidth)} │`));
    console.log(color(`│ URL:       ${truncate(request.url, valueWidth)} │`));
    console.log(color(`│ Duration:  ${truncate(`${request.duration}ms`, valueWidth)} │`));
    
    const statusColor = 
      (request.statusCode || 0) < 300 ? chalk.green :
      (request.statusCode || 0) < 400 ? chalk.cyan :
      (request.statusCode || 0) < 500 ? chalk.yellow :
      chalk.red;
    
    // Ensure status line is properly aligned
    const statusValue = `${request.statusCode || ''}`;
    console.log(color(`│ Status:    `) + statusColor(truncate(statusValue, valueWidth + 1)) + color('│'));
    
    console.log(color('├' + '─'.repeat(boxWidth - 2) + '┤'));
    
    // Center the timeline title
    const timelineTitle = ' TIMELINE ';
    const timelinePadding = Math.floor((boxWidth - 2 - timelineTitle.length) / 2);
    console.log(color('│' + ' '.repeat(timelinePadding) + timelineTitle + ' '.repeat(boxWidth - 2 - timelinePadding - timelineTitle.length) + '│'));
    
    console.log(color('├' + '─'.repeat(boxWidth - 2) + '┤'));
    
    // Print timeline of events with proper alignment
    request.logs.forEach((log) => {
      const logColor = CustomLogger.LEVEL_COLORS[log.level as keyof typeof CustomLogger.LEVEL_COLORS] || color;
      const timeStr = new Date(log.timestamp).toISOString().split('T')[1].slice(0, -1);
      const logEntry = `${timeStr} - ${log.message}`;
      console.log(color('│ ') + logColor(truncate(logEntry, boxWidth - 4)) + color(' │'));
    });
    
    console.log(color('└' + '─'.repeat(boxWidth - 2) + '┘'));
    console.log(color('─'.repeat(CustomLogger.ENDING_LINE_WIDTH)));
    console.log('\n');
  }
} 