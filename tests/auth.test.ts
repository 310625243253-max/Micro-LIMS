import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seeds/seed.js';

describe('MicroLIMS Auth & Platform Foundation Tests', () => {
  let app: any;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await seedDatabase();
    app = createApp();
  });

  it('GET /api/health - should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.system).toBe('MicroLIMS Backend API');
  });

  it('POST /api/v1/auth/login - should authenticate valid user and return tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@microlims.lab',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe('admin@microlims.lab');
    expect(res.body.data.user.roles).toContain('ADMIN');
  });

  it('POST /api/v1/auth/login - should reject incorrect password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@microlims.lab',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/me - should return profile for authenticated user', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'tech@microlims.lab',
        password: 'Password123!',
      });

    const token = loginRes.body.data.accessToken;

    // 2. Query /me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.email).toBe('tech@microlims.lab');
    expect(meRes.body.data.roles).toContain('TECHNICIAN');
  });

  it('GET /api/v1/auth/me - should reject request without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/refresh - should issue new access token using refresh token', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'micro@microlims.lab',
        password: 'Password123!',
      });

    const refreshToken = loginRes.body.data.refreshToken;

    // 2. Refresh
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data).toHaveProperty('accessToken');
  });
});
