import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seeds/seed.js';

describe('MicroLIMS Complete 16-Step End-to-End Diagnostic Lifecycle', () => {
  let app: any;
  let techToken: string;
  let microToken: string;
  let reviewerToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    await initDb();
    await runMigrations();
    await seedDatabase();
    app = createApp();
  });

  it('Executes complete Sample-to-Report Workflow with Cryptographic Verification', async () => {
    // -------------------------------------------------------------------------
    // Step 1: Login as Medical Lab Technician
    // -------------------------------------------------------------------------
    const techLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'tech@microlims.lab', password: 'Password123!' });

    expect(techLogin.status).toBe(200);
    techToken = techLogin.body.data.accessToken;

    // -------------------------------------------------------------------------
    // Step 2: Accession new blood culture specimen
    // -------------------------------------------------------------------------
    const sampleRes = await request(app)
      .post('/api/v1/samples')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        patientSyntheticId: 'SYN-PAT-E2E-777',
        patientSyntheticName: 'Arthur Dent',
        sampleType: 'BLOOD',
        collectionSite: 'Right Median Cubital Vein',
        priority: 'STAT',
        collectedAt: new Date().toISOString(),
        clinicalNotes: 'Persistent spiking bacteremia, procalcitonin 8.4 ng/mL.',
      });

    expect(sampleRes.status).toBe(201);
    const sampleId = sampleRes.body.data.id;
    const accessionNumber = sampleRes.body.data.accession_number;
    expect(accessionNumber).toMatch(/^SMP-\d{2}-\d{5}$/);
    expect(sampleRes.body.data.status).toBe('ACCESSIONED');

    // -------------------------------------------------------------------------
    // Step 3: Fetch active media lots and Inoculate primary culture plate
    // -------------------------------------------------------------------------
    const mediaRes = await request(app)
      .get('/api/v1/media?status=ACTIVE')
      .set('Authorization', `Bearer ${techToken}`);

    expect(mediaRes.status).toBe(200);
    const mediaLot = mediaRes.body.data[0];
    expect(mediaLot).toBeDefined();

    const cultureRes = await request(app)
      .post('/api/v1/cultures')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        sampleId,
        mediaLotId: mediaLot.id,
        mediaType: 'Blood Agar (5% Sheep Blood)',
        inoculationMethod: 'STREAK_4_QUADRANT',
        notes: 'Inoculated for isolation of single colonies.',
      });

    expect(cultureRes.status).toBe(201);
    const cultureId = cultureRes.body.data.id;
    const cultureCode = cultureRes.body.data.culture_code;
    expect(cultureCode).toMatch(/^CUL-\d{2}-\d{5}$/);

    // -------------------------------------------------------------------------
    // Step 4: Schedule and Start Incubation Chamber
    // -------------------------------------------------------------------------
    const incubationRes = await request(app)
      .post('/api/v1/incubations')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        cultureId,
        incubatorId: 'INCUBATOR-A1',
        temperatureCelsius: 37.0,
        atmosphere: 'AEROBIC',
        durationHours: 24,
        operatorNotes: 'Digital temperature log calibrated.',
      });

    expect(incubationRes.status).toBe(201);
    const incubationId = incubationRes.body.data.id;
    expect(incubationRes.body.data.status).toBe('RUNNING');

    // -------------------------------------------------------------------------
    // Step 5: Complete Incubation Cycle
    // -------------------------------------------------------------------------
    const completeIncRes = await request(app)
      .patch(`/api/v1/incubations/${incubationId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'COMPLETED', operatorNotes: 'Incubation period fulfilled.' });

    expect(completeIncRes.status).toBe(200);
    expect(completeIncRes.body.data.status).toBe('COMPLETED');

    // -------------------------------------------------------------------------
    // Step 6: Login as Senior Microbiologist
    // -------------------------------------------------------------------------
    const microLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'micro@microlims.lab', password: 'Password123!' });

    expect(microLogin.status).toBe(200);
    microToken = microLogin.body.data.accessToken;

    // -------------------------------------------------------------------------
    // Step 7: Record Growth & Colonial Morphology
    // -------------------------------------------------------------------------
    const obsRes = await request(app)
      .post('/api/v1/observations')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        cultureId,
        growthDetected: true,
        growthStatus: 'HEAVY_GROWTH',
        colonyMorphology: 'Golden-yellow circular smooth glistening colonies with beta-hemolytic clearing zone',
        pigmentation: 'Golden yellow',
        hemolysis: 'BETA',
        colonyCountCfu: '> 10^5 CFU/mL',
        notes: 'Classic beta-hemolytic morphology.',
      });

    expect(obsRes.status).toBe(201);
    expect(obsRes.body.data.growth_detected).toBe(true);

    // -------------------------------------------------------------------------
    // Step 8: Perform Biochemical Identification Battery
    // -------------------------------------------------------------------------
    const test1Res = await request(app)
      .post('/api/v1/tests')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        cultureId,
        testName: 'Catalase Test',
        method: '3% Hydrogen Peroxide Slide Method',
        rawResult: 'Positive (Immediate vigorous gas bubbles)',
        interpretation: 'Catalase positive confirms Staphylococcaceae differentiation',
      });
    expect(test1Res.status).toBe(201);

    const test2Res = await request(app)
      .post('/api/v1/tests')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        cultureId,
        testName: 'Coagulase Test',
        method: 'Tube Coagulase (Rabbit Plasma at 37°C)',
        rawResult: 'Positive (Solid fibrin clot formation)',
        interpretation: 'Positive coagulase confirms Staphylococcus aureus',
      });
    expect(test2Res.status).toBe(201);

    // -------------------------------------------------------------------------
    // Step 9: Record AST Antibiogram Panel
    // -------------------------------------------------------------------------
    const astRes = await request(app)
      .post('/api/v1/ast/batch')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        cultureId,
        organismIdentified: 'Staphylococcus aureus',
        records: [
          {
            antibioticName: 'Cefoxitin (30 µg)',
            method: 'KIRBY_BAUER_DISC',
            zoneDiameterMm: 24.0,
            interpretation: 'SUSCEPTIBLE',
            referenceGuideline: 'CLSI-M100-DEMO (>= 22 mm: S / MSSA confirmed)',
          },
          {
            antibioticName: 'Vancomycin',
            method: 'MIC_BROTH_DILUTION',
            micValueUgMl: 1.0,
            interpretation: 'SUSCEPTIBLE',
            referenceGuideline: 'CLSI-M100-DEMO (<= 2 µg/mL: S)',
          },
          {
            antibioticName: 'Gentamicin (10 µg)',
            method: 'KIRBY_BAUER_DISC',
            zoneDiameterMm: 21.0,
            interpretation: 'SUSCEPTIBLE',
            referenceGuideline: 'CLSI-M100-DEMO (>= 15 mm: S)',
          },
        ],
      });

    expect(astRes.status).toBe(201);
    expect(astRes.body.data.length).toBe(3);

    // -------------------------------------------------------------------------
    // Step 10: Submit Specimen Workup for Quality Assurance Review
    // -------------------------------------------------------------------------
    const submitRes = await request(app)
      .post('/api/v1/reviews/submit')
      .set('Authorization', `Bearer ${microToken}`)
      .send({
        sampleId,
        comments: 'MSSA isolated from blood culture. Full AST panel validated.',
      });

    expect(submitRes.status).toBe(200);

    // -------------------------------------------------------------------------
    // Step 11 & 12: Login as Reviewer & Inspect Pending Review Queue
    // -------------------------------------------------------------------------
    const reviewerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reviewer@microlims.lab', password: 'Password123!' });

    expect(reviewerLogin.status).toBe(200);
    reviewerToken = reviewerLogin.body.data.accessToken;

    const pendingRes = await request(app)
      .get('/api/v1/reviews/pending')
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(pendingRes.status).toBe(200);
    const pendingItem = pendingRes.body.data.find((s: any) => s.id === sampleId);
    expect(pendingItem).toBeDefined();

    // -------------------------------------------------------------------------
    // Step 13: Execute Electronic Sign-off with Cryptographic Hash
    // -------------------------------------------------------------------------
    const signOffRes = await request(app)
      .post('/api/v1/reviews/sign-off')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({
        sampleId,
        decision: 'APPROVE',
        signerName: 'Dr. Elena Rostova',
        signerTitle: 'Quality Assurance Manager',
        comments: 'Internal controls verified. Full concordance with MSSA clinical profile. Approved.',
      });

    expect(signOffRes.status).toBe(201);
    expect(signOffRes.body.data.stage).toBe('FINALIZED');
    expect(signOffRes.body.data.electronic_signature_hash).toMatch(/^[a-f0-9]{64}$/);

    // -------------------------------------------------------------------------
    // Step 14: Synthesize Official PDF Diagnostic Report
    // -------------------------------------------------------------------------
    const reportRes = await request(app)
      .post(`/api/v1/reports/generate/${sampleId}`)
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(reportRes.status).toBe(201);
    const reportCode = reportRes.body.data.report_code;
    const checksum = reportRes.body.data.checksum_sha256;
    expect(reportCode).toMatch(/^RPT-\d{2}-\d{5}$/);
    expect(checksum).toMatch(/^[a-f0-9]{64}$/);

    // Download generated PDF binary
    const downloadRes = await request(app)
      .get(`/api/v1/reports/${reportRes.body.data.id}/download`)
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers['content-type']).toBe('application/pdf');
    expect(downloadRes.body.length).toBeGreaterThan(500);

    // -------------------------------------------------------------------------
    // Step 15: Verify Checksum for Tamper-Evidence
    // -------------------------------------------------------------------------
    const verifyRes = await request(app)
      .post('/api/v1/reports/verify')
      .send({ checksum });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.valid).toBe(true);
    expect(verifyRes.body.data.report.report_code).toBe(reportCode);

    // -------------------------------------------------------------------------
    // Step 16: Login as Consulting Physician / Viewer & Inspect Complete Audit Trail
    // -------------------------------------------------------------------------
    const viewerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@microlims.lab', password: 'Password123!' });

    expect(viewerLogin.status).toBe(200);
    viewerToken = viewerLogin.body.data.accessToken;

    const auditRes = await request(app)
      .get(`/api/v1/audit?search=${accessionNumber}`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.length).toBeGreaterThanOrEqual(1);

    // Also verify complete lineage graph endpoint
    const lineageRes = await request(app)
      .get(`/api/v1/samples/${sampleId}/lineage`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(lineageRes.status).toBe(200);
    expect(lineageRes.body.data.sample.accession_number).toBe(accessionNumber);
    expect(lineageRes.body.data.sample.status).toBe('FINALIZED');
    expect(lineageRes.body.data.cultures.length).toBe(1);
    expect(lineageRes.body.data.incubations.length).toBe(1);
    expect(lineageRes.body.data.observations.length).toBe(1);
    expect(lineageRes.body.data.tests.length).toBe(2);
    expect(lineageRes.body.data.astRecords.length).toBe(3);
    expect(lineageRes.body.data.reviews.length).toBe(1);
    expect(lineageRes.body.data.reports.length).toBe(1);
  });
});
