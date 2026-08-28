import { Redis } from 'ioredis';
import { config } from '../config/env.js';

let redisClient: Redis | null = null;
let isRedisConnected = false;

/**
 * Initialize Redis connection safely with error handling and fallback
 */
export function initRedis(): Redis | null {
  if (redisClient) return redisClient;

  try {
    const client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 3) {
          return null; // Stop retrying after 3 attempts
        }
        return Math.min(times * 500, 2000);
      },
      lazyConnect: true,
    });

    client.on('connect', () => {
      isRedisConnected = true;
      console.log(`[REDIS] Connected to Redis cache at ${config.redis.url}`);
    });

    client.on('error', (err) => {
      isRedisConnected = false;
      // Do not crash - log warning only
      if (err.message.includes('ECONNREFUSED')) {
        // Suppress repetitive connection refused errors in local dev
      } else {
        console.warn(`[REDIS] Cache warning (${err.message}). PostgreSQL fallback active.`);
      }
    });

    client.connect().catch((err) => {
      isRedisConnected = false;
      console.warn(`[REDIS] Redis instance not reachable (${err.message}). Fallback to PostgreSQL caching.`);
    });

    redisClient = client;
    return redisClient;
  } catch (err: any) {
    console.warn(`[REDIS] Initialization note: ${err.message}`);
    return null;
  }
}

/**
 * Retrieve cached JSON value by key
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redisClient || !isRedisConnected) return null;
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * Store JSON value in cache with TTL in seconds
 */
export async function setCache(key: string, data: any, ttlSeconds = 60): Promise<void> {
  if (!redisClient || !isRedisConnected) return;
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // Ignore cache set errors
  }
}

/**
 * Invalidate a cache key or keys matching pattern
 */
export async function invalidateCache(patternOrKey: string): Promise<void> {
  if (!redisClient || !isRedisConnected) return;
  try {
    if (patternOrKey.includes('*')) {
      const keys = await redisClient.keys(patternOrKey);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } else {
      await redisClient.del(patternOrKey);
    }
  } catch {
    // Ignore cache invalidation errors
  }
}

export function isRedisHealthy(): boolean {
  return isRedisConnected;
}
