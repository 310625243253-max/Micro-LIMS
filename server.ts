import { createApp } from './src/app.js';
import { config } from './src/config/env.js';
import { initDb, query, isUsingMemoryDb } from './src/db/index.js';
import { runMigrations } from './src/db/migrate.js';
import { seedDatabase } from './src/db/seeds/seed.js';
import { initRedis } from './src/utils/cache.js';
import { startIncubationScheduler, stopIncubationScheduler } from './src/modules/incubations/incubation.scheduler.js';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import express from 'express';

async function startServer(): Promise<void> {
  try {
    console.log(`[SERVER] Initializing MicroLIMS Server in ${config.nodeEnv} mode...`);

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

    // 6. Vite Middleware for SPA Frontend
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        root: path.resolve(process.cwd(), 'frontend'),
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(process.cwd(), 'frontend', 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const port = config.port || 3000;
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(` 🔬 MicroLIMS Full-Stack Application Running`);
      console.log(` 🌐 URL: http://0.0.0.0:${port}`);
      console.log(` 🏥 Health Check: http://0.0.0.0:${port}/api/health`);
      console.log(` 🔐 Auth Endpoint: http://0.0.0.0:${port}/api/v1/auth/login`);
      console.log(` 📊 Dashboard API: http://0.0.0.0:${port}/api/v1/dashboard/metrics`);
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
