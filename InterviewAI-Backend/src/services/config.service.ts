import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { CustomLogger } from '../utils/custom-logger';

const logger = new CustomLogger('Config');

/**
 * Service for managing application configuration
 * Loads environment variables from .env file
 */
export class ConfigService {
  private readonly envConfig: Record<string, string>;
  private readonly dotEnvVariables: Record<string, string> = {};

  constructor() {
    // Parse the .env file
    const result = dotenv.config();

    // Store all environment variables
    this.envConfig = { ...process.env } as Record<string, string>;
    
    // If .env file was found and parsed successfully
    if (result.parsed) {
      // Store only the variables that were in the .env file
      this.dotEnvVariables = result.parsed;
    } else {
      // Try to manually read .env file to get the variables
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const envLines = envContent.split('\n');
          
          envLines.forEach(line => {
            // Skip comments and empty lines
            if (line.trim() && !line.startsWith('#')) {
              const [key, ...valueParts] = line.split('=');
              if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim();
                // Remove quotes if present
                const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
                this.dotEnvVariables[key.trim()] = cleanValue;
              }
            }
          });
        }
      } catch (error) {
        logger.warn('Error reading .env file manually');
      }
    }
  }

  /**
   * Get environment variable by key
   */
  get(key: string): string {
    return this.envConfig[key];
  }

  /**
   * Get all environment variables
   */
  getAll(): Record<string, string> {
    return { ...this.envConfig };
  }

  /**
   * Get only the variables that were loaded from the .env file
   */
  getDotEnvVariables(): Record<string, string> {
    return { ...this.dotEnvVariables };
  }

  /**
   * Get MongoDB URI from environment
   */
  getMongoURI(): string {
    const uri = this.get('MONGODB_URI');
    const user = this.get('MONGODB_USER');
    const password = this.get('MONGODB_PASSWORD');
    const host = this.get('MONGODB_HOST') || 'localhost';
    const port = this.get('MONGODB_PORT') || '27017';
    const database = this.get('MONGODB_DATABASE') || 'app_database';

    // If URI is explicitly provided, use it
    if (uri) return uri;

    // Otherwise construct from parts
    if (user && password) {
      return `mongodb://${user}:${password}@${host}:${port}/${database}`;
    }

    return `mongodb://${host}:${port}/${database}`;
  }

  /**
   * Get application port
   */
  getPort(): number {
    return parseInt(this.get('PORT') || '3000', 10);
  }

  /**
   * Check if application is in production mode
   */
  isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  /**
   * Check if application is in development mode
   */
  isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  /**
   * Check if application is in test mode
   */
  isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }
} 