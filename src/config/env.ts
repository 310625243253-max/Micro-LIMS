import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  db: {
    url: process.env.DATABASE_URL || 'postgresql://microlims_user:microlims_dev_password@localhost:5432/microlims_db',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'microlims_user',
    password: process.env.PGPASSWORD || 'microlims_dev_password',
    database: process.env.PGDATABASE || 'microlims_db',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'microlims_access_super_secret_key_demo_2026_x99!',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'microlims_refresh_super_secret_key_demo_2026_z88!',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000').split(','),
};
