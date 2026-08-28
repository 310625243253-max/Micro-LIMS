import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seeds/seed.js';

describe('Observations, Biochemical Tests & AST Integration Tests', () => {
  let app: any;
  let microToken: string;
  let sampleId: string;
  let cultureId: string;

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

    // Accession sample & culture
    const sampleRes = await request(app)
      .post('/api/v1/samples')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        patientSyntheticId: 'SYN-PAT-DIAG-01',
        sampleType: 'URINE',
        collectionSite: 'Clean Catch',
        priority: 'URGENT',
        collectedAt: new Date().toISOString(),
      });
    sampleId = sampleRes.body.data.id;

    const cultureRes = await request(app)
      .post('/api/v1/cultures')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        sampleId,
        mediaType: 'MacConkey Agar',
        inoculationMethod: 'STREAK_4_QUADRANT',
      });
    cultureId = cultureRes.body.data.id;
  });

  it('POST /api/v1/observations - should record colonial morphology reading', async () => {
    const res = await request(app)
      .post('/api/v1/observations')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        cultureId,
        growthDetected: true,
        growthStatus: 'HEAVY_GROWTH',
        colonyMorphology: 'Pink, lactose-fermenting, circular, mucoid colonies with distinct halo',
        pigmentation: 'Pinkish red',
        hemolysis: 'NONE',
        colonyCountCfu: '> 10^5 CFU/mL',
        notes: 'Significant bacteriuria indicative of UTI.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.growth_detected).toBe(true);
    expect(res.body.data.growth_status).toBe('HEAVY_GROWTH');
  });

  it('POST /api/v1/tests - should record biochemical diagnostic test', async () => {
    const res = await request(app)
      .post('/api/v1/tests')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        cultureId,
        testName: 'Indole Test',
        method: 'Kovac Reagent Spot Test',
        rawResult: 'Positive (Immediate red cherry ring)',
        interpretation: 'Positive reaction confirms tryptophanase activity (Escherichia coli confirmation)',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.test_code).toMatch(/^TST-\d{2}-\d{5}$/);
    expect(res.body.data.raw_result).toContain('Positive');
  });

  it('POST /api/v1/ast/batch - should record multiple antibiotic susceptibility results', async () => {
    const res = await request(app)
      .post('/api/v1/ast/batch')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        cultureId,
        organismIdentified: 'Escherichia coli',
        records: [
          {
            antibioticName: 'Nitrofurantoin (300 µg)',
            method: 'KIRBY_BAUER_DISC',
            zoneDiameterMm: 20.0,
            interpretation: 'SUSCEPTIBLE',
            referenceGuideline: 'CLSI-M100-DEMO',
          },
          {
            antibioticName: 'Ampicillin (10 µg)',
            method: 'KIRBY_BAUER_DISC',
            zoneDiameterMm: 11.0,
            interpretation: 'RESISTANT',
            referenceGuideline: 'CLSI-M100-DEMO',
          },
          {
            antibioticName: 'Ciprofloxacin',
            method: 'MIC_BROTH_DILUTION',
            micValueUgMl: 0.25,
            interpretation: 'SUSCEPTIBLE',
            referenceGuideline: 'CLSI-M100-DEMO',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0].ast_code).toMatch(/^AST-\d{2}-\d{5}$/);
  });
});
