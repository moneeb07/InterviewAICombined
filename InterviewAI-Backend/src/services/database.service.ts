import mongoose from 'mongoose';
import { mongoConfig } from '../config/database.config';
import { CustomLogger } from '../utils/custom-logger';

const logger = new CustomLogger('Database');

/**
 * MongoDB connection service
 * Handles connection to MongoDB using Mongoose
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private isConnected = false;

  private constructor() {
    // Private constructor to enforce singleton pattern
    this.setupMongooseEvents();
  }

  /**
   * Get the singleton instance of DatabaseService
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to MongoDB
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.debug('Already connected to MongoDB');
      return;
    }

    try {
      await mongoose.connect(mongoConfig.uri, mongoConfig.options);
      this.isConnected = true;
      logger.log({
        message: 'Connected to MongoDB',
        uri: this.maskConnectionString(mongoConfig.uri)
      });
    } catch (error) {
      logger.error({
        message: 'Failed to connect to MongoDB',
        error
      });
      // Retry connection after delay
      setTimeout(() => this.connect(), 5000);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.log('Disconnected from MongoDB');
    } catch (error) {
      logger.error({
        message: 'Error disconnecting from MongoDB',
        error
      });
    }
  }

  /**
   * Check if connected to MongoDB
   */
  public isConnectedToMongoDB(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Get the Mongoose connection
   */
  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  /**
   * Setup Mongoose connection event handlers
   */
  private setupMongooseEvents(): void {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      logger.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error({
        message: 'Mongoose connection error',
        error: err
      });
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Mask sensitive information in connection string
   */
  private maskConnectionString(uri: string): string {
    try {
      const maskedUri = new URL(uri);
      if (maskedUri.password) {
        maskedUri.password = '****';
      }
      return maskedUri.toString();
    } catch (error) {
      // If URI parsing fails, return a generic masked string
      return uri.replace(/\/\/.*@/, '//****:****@');
    }
  }
}

// Export a singleton instance
export const databaseService = DatabaseService.getInstance(); 