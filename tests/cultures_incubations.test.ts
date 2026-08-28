import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seeds/seed.js';

describe('Cultures, Media Lineage & Incubations Tests', () => {
  let app: any;
  let techToken: string;
  let sampleId: string;
  let mediaLotId: string;
  let cultureId: string;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await seedDatabase();
    app = createApp();

    const techLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'tech@microlims.lab',
      password: 'Password123!',
    });
    techToken = techLogin.body.data.accessToken;

    // Get a media lot
    const mediaRes = await request(app)
      .get('/api/v1/media')
      .set('Authorization', `Bearer ${techToken}`);
    mediaLotId = mediaRes.body.data[0].id;

    // Accession sample
    const sampleRes = await request(app)
      .post('/api/v1/samples')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        patientSyntheticId: 'SYN-PAT-CUL-TEST',
        sampleType: 'CSF',
        collectionSite: 'Lumbar Puncture',
        priority: 'STAT',
        collectedAt: new Date().toISOString(),
      });
    sampleId = sampleRes.body.data.id;
  });

  it('POST /api/v1/cultures - should inoculate a culture plate with media traceability', async () => {
    const res = await request(app)
      .post('/api/v1/cultures')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        sampleId,
        mediaLotId,
        mediaType: 'Blood Agar (5% Sheep Blood)',
        inoculationMethod: 'STREAK_4_QUADRANT',
        notes: 'Inoculated in laminar flow biological safety cabinet.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.culture_code).toMatch(/^CUL-\d{2}-\d{5}$/);
    expect(res.body.data.status).toBe('INOCULATED');
    expect(res.body.data.media_lot_id).toBe(mediaLotId);
    cultureId = res.body.data.id;
  });

  it('POST /api/v1/incubations - should schedule and start incubation cycle', async () => {
    const res = await request(app)
      .post('/api/v1/incubations')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        cultureId,
        incubatorId: 'INCUBATOR-TEST-1',
        temperatureCelsius: 37.0,
        atmosphere: 'AEROBIC',
        durationHours: 24,
        operatorNotes: 'Digital temperature alarm threshold checked.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.incubation_code).toMatch(/^INC-\d{2}-\d{5}$/);
    expect(res.body.data.status).toBe('RUNNING');
    expect(res.body.data.temperature_celsius).toBe(37.0);

    const incId = res.body.data.id;

    // Mark completed
    const completeRes = await request(app)
      .patch(`/api/v1/incubations/${incId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'COMPLETED', operatorNotes: '24h cycle complete.' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');
  });
});
