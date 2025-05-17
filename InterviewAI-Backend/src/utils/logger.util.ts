import chalk from 'chalk';
import { CustomLogger } from './custom-logger';
import { ConfigService } from '../services/config.service';

const logger = new CustomLogger('Environment');

/**
 * Log success message with context
 */
export const logSuccess = (message: string, context?: string) => {
  const contextLogger = context ? new CustomLogger(context) : logger;
  contextLogger.log(`✓ ${message}`);
};

/**
 * Log warning message with context
 */
export const logWarning = (message: string, context?: string) => {
  const contextLogger = context ? new CustomLogger(context) : logger;
  contextLogger.warn(`⚠ ${message}`);
};

/**
 * Log error message with context
 */
export const logError = (message: string, context?: string) => {
  const contextLogger = context ? new CustomLogger(context) : logger;
  contextLogger.error(`✗ ${message}`);
};

/**
 * Log info message with context
 */
export const logInfo = (message: string, context?: string) => {
  const contextLogger = context ? new CustomLogger(context) : logger;
  contextLogger.debug(`ℹ ${message}`);
};

/**
 * Format a table row with key-value pair
 */
const formatTableRow = (key: string, value: string, maxKeyLength: number, maxValueLength: number): string => {
  // Mask sensitive values
  const displayValue = key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY') 
    ? '****' 
    : value;
  
  return `│ ${key.padEnd(maxKeyLength)} │ ${displayValue.padEnd(maxValueLength)} │`;
};

/**
 * Print a table with environment variables
 */
const printEnvTable = (variables: Record<string, string>) => {
  if (Object.keys(variables).length === 0) return;

  // Calculate column widths
  const maxKeyLength = Math.max(...Object.keys(variables).map(k => k.length), 20);
  const maxValueLength = Math.max(...Object.values(variables).map(v => v.length), 30);
  const tableWidth = maxKeyLength + maxValueLength + 7; // 7 for borders and padding

  // Print table header
  console.log(chalk.cyan('┌' + '─'.repeat(tableWidth - 2) + '┐'));
  console.log(chalk.cyan('│ ' + 'Environment Variables'.padEnd(tableWidth - 4) + ' │'));
  console.log(chalk.cyan('├' + '─'.repeat(maxKeyLength + 2) + '┬' + '─'.repeat(maxValueLength + 2) + '┤'));
  console.log(chalk.cyan('│ ' + 'Variable'.padEnd(maxKeyLength) + ' │ ' + 'Value'.padEnd(maxValueLength) + ' │'));
  console.log(chalk.cyan('├' + '─'.repeat(maxKeyLength + 2) + '┼' + '─'.repeat(maxValueLength + 2) + '┤'));

  // Print table rows - sort keys alphabetically
  Object.keys(variables).sort().forEach(key => {
    console.log(chalk.cyan(formatTableRow(key, variables[key], maxKeyLength, maxValueLength)));
  });

  // Print table footer
  console.log(chalk.cyan('└' + '─'.repeat(maxKeyLength + 2) + '┴' + '─'.repeat(maxValueLength + 2) + '┘'));
};

/**
 * Log environment variables loaded from .env file
 */
export const logEnvironmentVariables = (configService: ConfigService) => {
  logInfo('.env Variables Loaded:');
  
  // Get only the variables that were loaded from .env file
  const dotEnvVars = configService.getDotEnvVariables();
  
  // Print all variables in a single table
  printEnvTable(dotEnvVars);
  
  logSuccess(`Loaded ${Object.keys(dotEnvVars).length} variables from .env file`);
};

// Export the CustomLogger class for direct use
export { CustomLogger }; 