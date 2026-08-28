import { createApp } from './app.js';
import { config } from './config/env.js';
import { initDb, query, isUsingMemoryDb } from './db/index.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seeds/seed.js';
import { initRedis } from './utils/cache.js';
import { startIncubationScheduler, stopIncubationScheduler } from './modules/incubations/incubation.scheduler.js';

async function startServer(): Promise<void> {
  try {
    console.log(`[SERVER] Initializing MicroLIMS Backend Server in ${config.nodeEnv} mode...`);

    // 1. Initialize Database Connection
    await initDb();

    // 2. Initialize Redis Cache Connection
    initRedis();

    // 3. Automatically Run Migrations and Seed if in memory mode or uninitialized
    try {
      await runMigrations();
      const userCheck = await query('SELECT count(*) FROM users');
      if (parseInt(userCheck.rows[0].count, 10) === 0) {
        console.log('[SERVER] Database is empty. Seeding initial demo data...');
        await seedDatabase();
      }
    } catch (dbErr: any) {
      console.warn('[SERVER] Auto-migration check notice:', dbErr.message);
    }

    // 4. Start Incubation Background Timer Daemon
    startIncubationScheduler(30000);

    // 5. Start Express HTTP Server
    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(` 🔬 MicroLIMS Backend API Server Running`);
      console.log(` 🌐 URL: http://localhost:${config.port}`);
      console.log(` 🏥 Health Check: http://localhost:${config.port}/api/health`);
      console.log(` 🔐 Auth Endpoint: http://localhost:${config.port}/api/v1/auth/login`);
      console.log(` 📊 Dashboard API: http://localhost:${config.port}/api/v1/dashboard/metrics`);
      console.log(` 💾 Database Mode: ${isUsingMemoryDb() ? 'In-Memory PostgreSQL Engine' : 'Live PostgreSQL Instance'}`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\n[SERVER] Gracefully shutting down MicroLIMS server...');
      stopIncubationScheduler();
      server.close(() => {
        console.log('[SERVER] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err: any) {
    console.error('[SERVER] Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
