import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seeds/seed.js';

describe('Dashboard Aggregator & Audit Explorer Tests', () => {
  let app: any;
  let adminToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await seedDatabase();
    app = createApp();

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@microlims.lab',
      password: 'Password123!',
    });
    adminToken = adminLogin.body.data.accessToken;

    const viewerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'viewer@microlims.lab',
      password: 'Password123!',
    });
    viewerToken = viewerLogin.body.data.accessToken;
  });

  it('GET /api/v1/dashboard/metrics - should return laboratory KPI aggregator metrics', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalSamples');
    expect(res.body.data).toHaveProperty('activeCultures');
    expect(res.body.data).toHaveProperty('runningIncubations');
    expect(res.body.data).toHaveProperty('dueIncubations');
    expect(res.body.data).toHaveProperty('pendingReviews');
    expect(res.body.data.totalSamples).toBeGreaterThanOrEqual(5);
  });

  it('GET /api/v1/dashboard/activity - should return chronological activity timeline', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/activity?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('action');
    expect(res.body.data[0]).toHaveProperty('createdAt');
  });

  it('GET /api/v1/audit - should allow ADMIN and VIEWER to query immutable audit trail', async () => {
    const res = await request(app)
      .get('/api/v1/audit?page=1&limit=10')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(5);
  });
});
