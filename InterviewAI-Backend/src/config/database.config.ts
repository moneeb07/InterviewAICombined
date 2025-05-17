import { ConfigService } from '../services/config.service';

const configService = new ConfigService();

/**
 * MongoDB connection configuration
 */
export interface MongoConfig {
  uri: string;
  options: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
    serverSelectionTimeoutMS: number;
    maxPoolSize: number;
    socketTimeoutMS: number;
    family: number;
  };
}

/**
 * Default MongoDB configuration
 */
export const mongoConfig: MongoConfig = {
  uri: configService.getMongoURI(),
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: configService.isProduction() ? 10 : 5,
    socketTimeoutMS: 45000,
    family: 4 // Use IPv4, skip trying IPv6
  }
}; 