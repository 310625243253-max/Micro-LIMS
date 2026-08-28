import crypto from 'crypto';
import { Pool, PoolClient, QueryResult } from 'pg';
import { newDb, IMemoryDb } from 'pg-mem';
import { config } from '../config/env.js';

let pool: Pool | null = null;
let memoryDb: IMemoryDb | null = null;
let memoryAdapter: any = null;
let isMemoryMode = false;

/**
 * Initialize Database Connection
 * Attempts live PostgreSQL connection first; gracefully falls back to high-fidelity in-memory PostgreSQL
 * for seamless zero-config local development and testing.
 */
export async function initDb(): Promise<void> {
  if (pool || memoryAdapter) {
    return;
  }

  const livePool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    connectionTimeoutMillis: 2000,
    max: 20,
    idleTimeoutMillis: 30000,
  });

  try {
    const client = await livePool.connect();
    await client.query('SELECT 1');
    client.release();
    pool = livePool;
    isMemoryMode = false;
    console.log(`[DB] Connected to PostgreSQL at ${config.db.host}:${config.db.port}/${config.db.database}`);
  } catch (err: any) {
    console.warn(`[DB] Live PostgreSQL unavailable (${err.message}). Initializing high-fidelity In-Memory PostgreSQL engine...`);
    
    memoryDb = newDb();
    
    // Register pgcrypto and uuid functions
    memoryDb.registerExtension('pgcrypto', (schema) => {
      schema.registerFunction({
        name: 'gen_random_uuid',
        impure: true,
        returns: schema.getType('uuid' as any),
        implementation: () => crypto.randomUUID(),
      });
    });

    // Register standard Postgres extension functions in memoryDb
    memoryDb.public.registerFunction({
      name: 'gen_random_uuid',
      impure: true,
      returns: memoryDb.public.getType('uuid' as any),
      implementation: () => crypto.randomUUID(),
    });

    memoryDb.public.registerFunction({
      name: 'now',
      impure: true,
      returns: memoryDb.public.getType('timestamp with time zone' as any),
      implementation: () => new Date(),
    });

    memoryDb.public.registerFunction({
      name: 'current_date',
      impure: true,
      returns: memoryDb.public.getType('date' as any),
      implementation: () => new Date().toISOString().split('T')[0],
    });

    memoryAdapter = memoryDb.adapters.createPg();
    pool = new memoryAdapter.Pool() as unknown as Pool;
    isMemoryMode = true;
    console.log(`[DB] In-Memory PostgreSQL engine active with full schema support.`);
  }
}

/**
 * Execute a parameterized query against PostgreSQL
 */
export async function query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  if (!pool) {
    await initDb();
  }
  return pool!.query<T>(text, params);
}

/**
 * Acquire a transactional database client
 */
export async function getClient(): Promise<PoolClient> {
  if (!pool) {
    await initDb();
  }
  return pool!.connect();
}

/**
 * Check if the current database connection is in-memory
 */
export function isUsingMemoryDb(): boolean {
  return isMemoryMode;
}

/**
 * Close database pool connection
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default {
  initDb,
  query,
  getClient,
  isUsingMemoryDb,
  closeDb,
};
