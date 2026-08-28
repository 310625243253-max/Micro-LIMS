import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seeds/seed.js';

describe('Samples & Accessioning Integration Tests', () => {
  let app: any;
  let adminToken: string;
  let techToken: string;
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

    const techLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'tech@microlims.lab',
      password: 'Password123!',
    });
    techToken = techLogin.body.data.accessToken;

    const viewerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'viewer@microlims.lab',
      password: 'Password123!',
    });
    viewerToken = viewerLogin.body.data.accessToken;
  });

  it('GET /api/v1/samples - should list samples with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/samples?page=1&limit=5')
      .set('Authorization', `Bearer ${techToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(5);
  });

  it('POST /api/v1/samples - should accession a new clinical sample with human-readable ID', async () => {
    const newSample = {
      patientSyntheticId: 'SYN-PAT-9999',
      patientSyntheticName: 'Alice Test',
      sampleType: 'BLOOD',
      collectionSite: 'Right Antecubital Vein',
      priority: 'STAT',
      collectedAt: new Date().toISOString(),
      clinicalNotes: 'Sudden onset spike in fever, rigors.',
    };

    const res = await request(app)
      .post('/api/v1/samples')
      .set('Authorization', `Bearer ${techToken}`)
      .send(newSample);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accession_number).toMatch(/^SMP-\d{2}-\d{5}$/);
    expect(res.body.data.status).toBe('ACCESSIONED');
    expect(res.body.data.patient_synthetic_id).toBe('SYN-PAT-9999');
  });

  it('POST /api/v1/samples - should reject accessioning by VIEWER role', async () => {
    const res = await request(app)
      .post('/api/v1/samples')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        patientSyntheticId: 'SYN-PAT-0000',
        sampleType: 'URINE',
        collectionSite: 'Midstream',
        priority: 'ROUTINE',
        collectedAt: new Date().toISOString(),
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/samples/:id/lineage - should return comprehensive specimen lineage', async () => {
    // Look up SMP-26-00001
    const searchRes = await request(app)
      .get('/api/v1/samples?search=SMP-26-00001')
      .set('Authorization', `Bearer ${adminToken}`);

    const sample = searchRes.body.data[0];
    expect(sample).toBeDefined();

    const lineageRes = await request(app)
      .get(`/api/v1/samples/${sample.id}/lineage`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(lineageRes.status).toBe(200);
    expect(lineageRes.body.data).toHaveProperty('sample');
    expect(lineageRes.body.data).toHaveProperty('cultures');
    expect(lineageRes.body.data).toHaveProperty('incubations');
    expect(lineageRes.body.data).toHaveProperty('observations');
    expect(lineageRes.body.data).toHaveProperty('tests');
    expect(lineageRes.body.data).toHaveProperty('astRecords');
  });

  it('PATCH /api/v1/samples/:id/status - should enforce valid state machine transitions', async () => {
    // Register a fresh sample
    const createRes = await request(app)
      .post('/api/v1/samples')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        patientSyntheticId: 'SYN-PAT-STATEMACHINE',
        sampleType: 'SPUTUM',
        collectionSite: 'Bronchoscopy',
        priority: 'URGENT',
        collectedAt: new Date().toISOString(),
      });

    const sampleId = createRes.body.data.id;

    // Transition ACCESSIONED -> IN_TESTING (Valid)
    const validTransition = await request(app)
      .patch(`/api/v1/samples/${sampleId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'IN_TESTING' });

    expect(validTransition.status).toBe(200);
    expect(validTransition.body.data.status).toBe('IN_TESTING');

    // Attempt IN_TESTING -> FINALIZED directly (Invalid without review/approval)
    const invalidTransition = await request(app)
      .patch(`/api/v1/samples/${sampleId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'FINALIZED' });

    expect(invalidTransition.status).toBe(400);
    expect(invalidTransition.body.success).toBe(false);
  });
});
