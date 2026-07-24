import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/madar',
  autoIndex: process.env.NODE_ENV !== 'production',
  maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10', 10),
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
}));
