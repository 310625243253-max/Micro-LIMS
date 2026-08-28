import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seeds/seed.js';

describe('Contamination & Quarantine Management Tests', () => {
  let app: any;
  let adminToken: string;
  let microToken: string;
  let reviewerToken: string;
  let sampleId: string;

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

    const microLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'micro@microlims.lab',
      password: 'Password123!',
    });
    microToken = microLogin.body.data.accessToken;

    const reviewerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'reviewer@microlims.lab',
      password: 'Password123!',
    });
    reviewerToken = reviewerLogin.body.data.accessToken;

    // Create a sample
    const sampleRes = await request(app)
      .post('/api/v1/samples')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        patientSyntheticId: 'SYN-PAT-QUARANTINE',
        sampleType: 'SWAB',
        collectionSite: 'Surgical Margin',
        priority: 'ROUTINE',
        collectedAt: new Date().toISOString(),
      });
    sampleId = sampleRes.body.data.id;
  });

  it('POST /api/v1/contamination - should report incident and automatically flag sample as quarantined', async () => {
    const res = await request(app)
      .post('/api/v1/contamination')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        sampleId,
        category: 'ENVIRONMENTAL',
        description: 'Airborne Aspergillus niger fungal mold detected in control quadrant of plate.',
        suspectedCause: 'Laminar flow HEPA filter integrity check pending.',
        status: 'QUARANTINED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.incident_code).toMatch(/^CON-\d{2}-\d{5}$/);
    expect(res.body.data.status).toBe('QUARANTINED');

    // Check sample is quarantined
    const sampleCheck = await request(app)
      .get(`/api/v1/samples/${sampleId}`)
      .set('Authorization', `Bearer ${microToken}`);

    expect(sampleCheck.body.data.quarantined).toBe(true);
  });

  it('POST /api/v1/reviews/sign-off - should block electronic approval while under active quarantine', async () => {
    // Attempt approval on quarantined sample
    const signOffRes = await request(app)
      .post('/api/v1/reviews/sign-off')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({
        sampleId,
        decision: 'APPROVE',
        signerName: 'Dr. Elena Rostova',
        signerTitle: 'Quality Assurance Manager',
      });

    expect(signOffRes.status).toBe(400);
    expect(signOffRes.body.success).toBe(false);
    expect(signOffRes.body.error).toContain('QUARANTINE');
  });

  it('PATCH /api/v1/contamination/:id - should resolve incident and clear quarantine flag', async () => {
    const listRes = await request(app)
      .get(`/api/v1/contamination?sampleId=${sampleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const incidentId = listRes.body.data[0].id;

    const resolveRes = await request(app)
      .patch(`/api/v1/contamination/${incidentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'RESOLVED',
        correctiveAction: 'Cabinet HEPA filter sanitized and re-certified. Duplicate specimen cultured cleanly.',
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('RESOLVED');

    // Verify sample is no longer quarantined
    const sampleCheck = await request(app)
      .get(`/api/v1/samples/${sampleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(sampleCheck.body.data.quarantined).toBe(false);
  });
});
