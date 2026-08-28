import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seeds/seed.js';

describe('Reviews, Electronic Sign-off & PDF Reports Tests', () => {
  let app: any;
  let microToken: string;
  let reviewerToken: string;
  let sampleId: string;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await seedDatabase();
    app = createApp();

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

    // Create a complete sample
    const sampleRes = await request(app)
      .post('/api/v1/samples')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        patientSyntheticId: 'SYN-PAT-SIGNOFF',
        sampleType: 'BLOOD',
        collectionSite: 'Peripheral Blood Culture',
        priority: 'URGENT',
        collectedAt: new Date().toISOString(),
      });
    sampleId = sampleRes.body.data.id;
  });

  it('POST /api/v1/reviews/submit - should submit specimen results for review', async () => {
    const res = await request(app)
      .post('/api/v1/reviews/submit')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        sampleId,
        comments: 'Gram stain and preliminary AST confirmed. Ready for QA sign-off.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const sampleCheck = await request(app)
      .get(`/api/v1/samples/${sampleId}`)
      .set('Authorization', `Bearer ${microToken}`);

    expect(sampleCheck.body.data.status).toBe('UNDER_REVIEW');
  });

  it('GET /api/v1/reviews/pending - should list pending reviews for reviewers', async () => {
    const res = await request(app)
      .get('/api/v1/reviews/pending')
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((s: any) => s.id === sampleId);
    expect(found).toBeDefined();
  });

  it('POST /api/v1/reviews/sign-off - should execute electronic signature with cryptographic hash', async () => {
    const res = await request(app)
      .post('/api/v1/reviews/sign-off')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({
        sampleId,
        decision: 'APPROVE',
        signerName: 'Dr. Elena Rostova',
        signerTitle: 'Quality Assurance Manager',
        comments: 'Concordant with standard laboratory protocol. Approved for clinical release.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stage).toBe('FINALIZED');
    expect(res.body.data.electronic_signature_hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex string

    const sampleCheck = await request(app)
      .get(`/api/v1/samples/${sampleId}`)
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(sampleCheck.body.data.status).toBe('FINALIZED');
  });

  it('POST /api/v1/reports/generate/:sampleId - should synthesize official PDF diagnostic report', async () => {
    const res = await request(app)
      .post(`/api/v1/reports/generate/${sampleId}`)
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.report_code).toMatch(/^RPT-\d{2}-\d{5}$/);
    expect(res.body.data.checksum_sha256).toMatch(/^[a-f0-9]{64}$/);

    const reportId = res.body.data.id;
    const checksum = res.body.data.checksum_sha256;

    // Download PDF
    const downloadRes = await request(app)
      .get(`/api/v1/reports/${reportId}/download`)
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toBe('application/pdf');
    expect(downloadRes.body.length).toBeGreaterThan(100);

    // Verify Checksum
    const verifyRes = await request(app)
      .post('/api/v1/reports/verify')
      .send({ checksum });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.valid).toBe(true);
    expect(verifyRes.body.data.report.id).toBe(reportId);
  });
});
