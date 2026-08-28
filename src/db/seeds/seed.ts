import bcrypt from 'bcryptjs';
import { initDb, query, getClient } from '../index.js';
import { runMigrations } from '../migrate.js';

export async function seedDatabase(): Promise<void> {
  console.log('[SEED] Starting MicroLIMS synthetic demo database seeding...');
  
  // Ensure schema is fully migrated first
  await runMigrations();

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Seed Roles
    console.log('[SEED] Seeding user roles...');
    const roles = [
      { name: 'ADMIN', desc: 'Full system management and administrative control' },
      { name: 'TECHNICIAN', desc: 'Sample accessioning, culture inoculation, incubation and testing' },
      { name: 'MICROBIOLOGIST', desc: 'Phenotypic reading, biochemical analysis, and AST entry' },
      { name: 'REVIEWER', desc: 'Quality control review, electronic verification and approvals' },
      { name: 'VIEWER', desc: 'Read-only access to finalized reports and audit logs' },
    ];

    const roleMap = new Map<string, string>();
    for (const r of roles) {
      const res = await client.query(
        `INSERT INTO roles (name, description) 
         VALUES ($1, $2) 
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description 
         RETURNING id, name`,
        [r.name, r.desc]
      );
      roleMap.set(res.rows[0].name, res.rows[0].id);
    }

    // 2. Seed Users
    console.log('[SEED] Seeding demo users with secure password hashing...');
    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    const users = [
      {
        email: 'admin@microlims.lab',
        first: 'Dr. Sarah',
        last: 'Chen',
        title: 'Laboratory Director',
        role: 'ADMIN',
      },
      {
        email: 'tech@microlims.lab',
        first: 'Alex',
        last: 'Rivera',
        title: 'Medical Lab Technician',
        role: 'TECHNICIAN',
      },
      {
        email: 'micro@microlims.lab',
        first: 'Dr. Marcus',
        last: 'Vance',
        title: 'Senior Microbiologist',
        role: 'MICROBIOLOGIST',
      },
      {
        email: 'reviewer@microlims.lab',
        first: 'Dr. Elena',
        last: 'Rostova',
        title: 'Quality Assurance Manager',
        role: 'REVIEWER',
      },
      {
        email: 'viewer@microlims.lab',
        first: 'Dr. James',
        last: 'Wilson',
        title: 'Consulting Physician',
        role: 'VIEWER',
      },
    ];

    const userMap = new Map<string, string>();
    for (const u of users) {
      let userRes = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [u.email]
      );
      let userId: string;
      if (userRes.rowCount && userRes.rowCount > 0) {
        userId = userRes.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name, title, is_active)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           RETURNING id`,
          [u.email, defaultPasswordHash, u.first, u.last, u.title]
        );
        userId = ins.rows[0].id;
      }
      userMap.set(u.email, userId);

      // Assign user role
      const roleId = roleMap.get(u.role);
      if (roleId) {
        await client.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [userId, roleId]
        );
      }
    }

    const adminId = userMap.get('admin@microlims.lab')!;
    const techId = userMap.get('tech@microlims.lab')!;
    const microId = userMap.get('micro@microlims.lab')!;
    const reviewerId = userMap.get('reviewer@microlims.lab')!;

    // 3. Seed Media Lots & Reagents
    console.log('[SEED] Seeding media lots and traceability inventory...');
    const mediaLots = [
      { lot: 'LOT-BA-2026-04', name: 'Blood Agar (5% Sheep Blood)', mfg: 'Becton Dickinson', exp: '2026-12-31', status: 'ACTIVE' },
      { lot: 'LOT-MAC-2026-03', name: 'MacConkey Agar', mfg: 'Thermo Fisher Scientific', exp: '2026-11-30', status: 'ACTIVE' },
      { lot: 'LOT-CHOC-2026-05', name: 'Chocolate Agar II', mfg: 'Hardy Diagnostics', exp: '2026-10-15', status: 'ACTIVE' },
      { lot: 'LOT-MHA-2026-08', name: 'Mueller-Hinton Agar', mfg: 'Oxoid Lab Products', exp: '2027-01-31', status: 'ACTIVE' },
    ];

    const mediaLotMap = new Map<string, string>();
    for (const m of mediaLots) {
      let res = await client.query(`SELECT id FROM media_lots WHERE lot_number = $1`, [m.lot]);
      let lotId: string;
      if (res.rowCount && res.rowCount > 0) {
        lotId = res.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO media_lots (lot_number, media_name, manufacturer, expiry_date, status, storage_conditions)
           VALUES ($1, $2, $3, $4, $5, 'Store refrigerated at 2-8°C')
           RETURNING id`,
          [m.lot, m.name, m.mfg, m.exp, m.status]
        );
        lotId = ins.rows[0].id;
      }
      mediaLotMap.set(m.lot, lotId);
    }

    const reagents = [
      { name: 'Gram Stain Set (Crystal Violet, Iodine, Safranin)', lot: 'LOT-GS-2026-01', mfg: 'Sigma-Aldrich', exp: '2027-06-30' },
      { name: 'Catalase Reagent (3% Hydrogen Peroxide)', lot: 'LOT-CAT-2026-02', mfg: 'BD BBL', exp: '2026-09-30' },
      { name: 'Coagulase Plasma (Lyophilized Rabbit Plasma)', lot: 'LOT-COAG-2026-06', mfg: 'Remel Products', exp: '2026-12-31' },
      { name: 'Oxidase Reagent Discs', lot: 'LOT-OXI-2026-09', mfg: 'Bio-Rad Laboratories', exp: '2026-12-15' },
    ];

    for (const r of reagents) {
      const exists = await client.query('SELECT 1 FROM reagents WHERE lot_number = $1', [r.lot]);
      if (!exists.rowCount || exists.rowCount === 0) {
        await client.query(
          `INSERT INTO reagents (reagent_name, lot_number, manufacturer, expiry_date, status)
           VALUES ($1, $2, $3, $4, 'ACTIVE')`,
          [r.name, r.lot, r.mfg, r.exp]
        );
      }
    }

    // 4. Seed Samples
    console.log('[SEED] Seeding realistic clinical specimens and lineage...');
    const samples = [
      {
        acc: 'SMP-26-00001',
        patId: 'SYN-PAT-1049',
        patName: 'John Doe',
        type: 'BLOOD',
        site: 'Left Antecubital Vein',
        priority: 'STAT',
        status: 'FINALIZED',
        notes: 'High fever (39.2°C), leukocytosis, suspected septicemia.',
      },
      {
        acc: 'SMP-26-00002',
        patId: 'SYN-PAT-1050',
        patName: 'Jane Smith',
        type: 'URINE',
        site: 'Clean Catch Midstream',
        priority: 'URGENT',
        status: 'UNDER_REVIEW',
        notes: 'Dysuria, burning micturition for 3 days.',
      },
      {
        acc: 'SMP-26-00003',
        patId: 'SYN-PAT-1051',
        patName: 'Robert Johnson',
        type: 'SPUTUM',
        site: 'Deep Endotracheal Aspirate',
        priority: 'ROUTINE',
        status: 'IN_TESTING',
        notes: 'Productive cough, chest consolidation in lower lobe.',
      },
      {
        acc: 'SMP-26-00004',
        patId: 'SYN-PAT-1052',
        patName: 'Emily Davis',
        type: 'CSF',
        site: 'Lumbar Puncture (L3-L4)',
        priority: 'STAT',
        status: 'ACCESSIONED',
        notes: 'Severe headache, nuchal rigidity, photophobia.',
      },
      {
        acc: 'SMP-26-00005',
        patId: 'SYN-PAT-1053',
        patName: 'Michael Brown',
        type: 'SWAB',
        site: 'Right Lower Leg Post-Surgical Wound',
        priority: 'ROUTINE',
        status: 'REGISTERED',
        notes: 'Erythema and purulent discharge at surgical margin.',
      },
    ];

    const sampleMap = new Map<string, string>();
    for (const s of samples) {
      let res = await client.query('SELECT id FROM samples WHERE accession_number = $1', [s.acc]);
      let sampleId: string;
      if (res.rowCount && res.rowCount > 0) {
        sampleId = res.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO samples (accession_number, patient_synthetic_id, patient_synthetic_name, sample_type, collection_site, priority, status, collected_at, received_at, accessioned_by, clinical_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', $8, $9)
           RETURNING id`,
          [s.acc, s.patId, s.patName, s.type, s.site, s.priority, s.status, techId, s.notes]
        );
        sampleId = ins.rows[0].id;
      }
      sampleMap.set(s.acc, sampleId);
    }

    // 5. Seed Cultures
    console.log('[SEED] Seeding inoculated media plates and culture lineage...');
    const cultures = [
      {
        code: 'CUL-26-00001',
        sampleAcc: 'SMP-26-00001',
        lot: 'LOT-BA-2026-04',
        media: 'Blood Agar (5% Sheep Blood)',
        method: 'STREAK_4_QUADRANT',
        status: 'OBSERVED',
        notes: 'Heavy aerobic growth isolated in primary and secondary quadrants.',
      },
      {
        code: 'CUL-26-00002',
        sampleAcc: 'SMP-26-00002',
        lot: 'LOT-MAC-2026-03',
        media: 'MacConkey Agar',
        method: 'STREAK_4_QUADRANT',
        status: 'OBSERVED',
        notes: 'Lactose-fermenting colony spread.',
      },
      {
        code: 'CUL-26-00003',
        sampleAcc: 'SMP-26-00003',
        lot: 'LOT-CHOC-2026-05',
        media: 'Chocolate Agar II',
        method: 'STREAK_4_QUADRANT',
        status: 'INCUBATING',
        notes: 'Incubating under 5% CO2 atmosphere.',
      },
    ];

    const cultureMap = new Map<string, string>();
    for (const c of cultures) {
      let res = await client.query('SELECT id FROM cultures WHERE culture_code = $1', [c.code]);
      let cultureId: string;
      if (res.rowCount && res.rowCount > 0) {
        cultureId = res.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO cultures (culture_code, sample_id, media_lot_id, media_type, inoculation_method, inoculated_at, inoculated_by, status, notes)
           VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '2 days', $6, $7, $8)
           RETURNING id`,
          [c.code, sampleMap.get(c.sampleAcc)!, mediaLotMap.get(c.lot)!, c.media, c.method, techId, c.status, c.notes]
        );
        cultureId = ins.rows[0].id;
      }
      cultureMap.set(c.code, cultureId);
    }

    // 6. Seed Incubations
    console.log('[SEED] Seeding incubator schedules (Completed, Due, Running)...');
    const incubations = [
      {
        code: 'INC-26-00001',
        cultureCode: 'CUL-26-00001',
        incubator: 'INCUBATOR-A1',
        temp: 37.0,
        atmosphere: 'AEROBIC',
        duration: 24,
        status: 'COMPLETED',
        startedAt: 'NOW() - INTERVAL \'48 hours\'',
        dueAt: 'NOW() - INTERVAL \'24 hours\'',
        completedAt: 'NOW() - INTERVAL \'24 hours\'',
      },
      {
        code: 'INC-26-00002',
        cultureCode: 'CUL-26-00002',
        incubator: 'INCUBATOR-B2',
        temp: 37.0,
        atmosphere: 'AEROBIC',
        duration: 24,
        status: 'DUE',
        startedAt: 'NOW() - INTERVAL \'24 hours\'',
        dueAt: 'NOW() - INTERVAL \'5 minutes\'',
        completedAt: 'NULL',
      },
      {
        code: 'INC-26-00003',
        cultureCode: 'CUL-26-00003',
        incubator: 'INCUBATOR-C1',
        temp: 35.5,
        atmosphere: 'CO2_5_PERCENT',
        duration: 48,
        status: 'RUNNING',
        startedAt: 'NOW() - INTERVAL \'6 hours\'',
        dueAt: 'NOW() + INTERVAL \'42 hours\'',
        completedAt: 'NULL',
      },
    ];

    for (const inc of incubations) {
      const exists = await client.query('SELECT 1 FROM incubations WHERE incubation_code = $1', [inc.code]);
      if (!exists.rowCount || exists.rowCount === 0) {
        await client.query(`
          INSERT INTO incubations (incubation_code, culture_id, incubator_id, temperature_celsius, atmosphere, duration_hours, status, started_at, expected_completion_at, completed_at, operator_notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, ${inc.startedAt}, ${inc.dueAt}, ${inc.completedAt}, 'Monitored digital chamber log')
        `, [inc.code, cultureMap.get(inc.cultureCode)!, inc.incubator, inc.temp, inc.atmosphere, inc.duration, inc.status]);
      }
    }

    // 7. Seed Morphology & Observations
    console.log('[SEED] Seeding colonial morphology readings...');
    const cul1Id = cultureMap.get('CUL-26-00001')!;
    const obs1Exists = await client.query('SELECT 1 FROM observations WHERE culture_id = $1', [cul1Id]);
    if (!obs1Exists.rowCount || obs1Exists.rowCount === 0) {
      await client.query(
        `INSERT INTO observations (culture_id, growth_detected, growth_status, colony_morphology, pigmentation, hemolysis, colony_count_cfu, observed_at, observed_by, notes)
         VALUES ($1, TRUE, 'HEAVY_GROWTH', 'Circular, convex, smooth, entire margin, moist glistening colonies', 'Golden yellow', 'BETA', '> 10^5 CFU/mL', NOW() - INTERVAL '20 hours', $2, 'Typical beta-hemolytic golden colonies.')`,
        [cul1Id, microId]
      );
    }

    const cul2Id = cultureMap.get('CUL-26-00002')!;
    const obs2Exists = await client.query('SELECT 1 FROM observations WHERE culture_id = $1', [cul2Id]);
    if (!obs2Exists.rowCount || obs2Exists.rowCount === 0) {
      await client.query(
        `INSERT INTO observations (culture_id, growth_detected, growth_status, colony_morphology, pigmentation, hemolysis, colony_count_cfu, observed_at, observed_by, notes)
         VALUES ($1, TRUE, 'MODERATE_GROWTH', 'Pink, circular, low convex, mucoid lactose-fermenting colonies', 'Pinkish red', 'NONE', '10^5 CFU/mL', NOW() - INTERVAL '1 hour', $2, 'Lactose fermenting colonies with bile precipitate halo.')`,
        [cul2Id, microId]
      );
    }

    // 8. Seed Tests
    console.log('[SEED] Seeding biochemical & identification battery...');
    const tests = [
      {
        code: 'TST-26-00001',
        cultureId: cul1Id,
        name: 'Gram Stain',
        method: 'Brightfield Microscopy (1000x Oil Immersion)',
        result: 'Gram-positive cocci in irregular grape-like clusters',
        interp: 'Morphology highly suggestive of Staphylococcus species',
      },
      {
        code: 'TST-26-00002',
        cultureId: cul1Id,
        name: 'Catalase Test',
        method: '3% Hydrogen Peroxide Slide Method',
        result: 'Positive (Immediate vigorous gas effervescence)',
        interp: 'Differentiates Staphylococcus (+) from Streptococcus (-)',
      },
      {
        code: 'TST-26-00003',
        cultureId: cul1Id,
        name: 'Coagulase Test',
        method: 'Tube Coagulase (Rabbit Plasma at 37°C)',
        result: 'Positive (Solid fibrin clot formation at 4 hours)',
        interp: 'Confirmatory identification for Staphylococcus aureus',
      },
      {
        code: 'TST-26-00004',
        cultureId: cul2Id,
        name: 'Gram Stain',
        method: 'Microscopy (1000x)',
        result: 'Gram-negative straight rods (bacilli)',
        interp: 'Morphology typical of Enterobacteriaceae',
      },
      {
        code: 'TST-26-00005',
        cultureId: cul2Id,
        name: 'Oxidase Test',
        method: 'Tetramethyl-p-phenylenediamine Disc Method',
        result: 'Negative (No deep purple color change within 30s)',
        interp: 'Consistent with Escherichia coli / Enterobacterales',
      },
    ];

    for (const t of tests) {
      const exists = await client.query('SELECT 1 FROM tests WHERE test_code = $1', [t.code]);
      if (!exists.rowCount || exists.rowCount === 0) {
        await client.query(
          `INSERT INTO tests (test_code, culture_id, test_name, method, raw_result, interpretation, performed_by, performed_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '18 hours', 'COMPLETED')`,
          [t.code, t.cultureId, t.name, t.method, t.result, t.interp, microId]
        );
      }
    }

    // 9. Seed AST Records
    console.log('[SEED] Seeding Kirby-Bauer & MIC Antimicrobial Susceptibility Testing panel...');
    const astRecords = [
      {
        code: 'AST-26-00001',
        cultureId: cul1Id,
        organism: 'Staphylococcus aureus',
        drug: 'Ciprofloxacin (5 µg)',
        method: 'KIRBY_BAUER_DISC',
        zone: 24.0,
        mic: null,
        interp: 'SUSCEPTIBLE',
        guideline: 'CLSI-M100-DEMO (>= 21 mm: S)',
      },
      {
        code: 'AST-26-00002',
        cultureId: cul1Id,
        organism: 'Staphylococcus aureus',
        drug: 'Oxacillin / Cefoxitin (30 µg)',
        method: 'KIRBY_BAUER_DISC',
        zone: 23.5,
        mic: null,
        interp: 'SUSCEPTIBLE',
        guideline: 'CLSI-M100-DEMO (>= 22 mm: S / MSSA confirmed)',
      },
      {
        code: 'AST-26-00003',
        cultureId: cul1Id,
        organism: 'Staphylococcus aureus',
        drug: 'Vancomycin',
        method: 'MIC_BROTH_DILUTION',
        zone: null,
        mic: 1.0,
        interp: 'SUSCEPTIBLE',
        guideline: 'CLSI-M100-DEMO (<= 2 µg/mL: S)',
      },
      {
        code: 'AST-26-00004',
        cultureId: cul1Id,
        organism: 'Staphylococcus aureus',
        drug: 'Gentamicin (10 µg)',
        method: 'KIRBY_BAUER_DISC',
        zone: 22.0,
        mic: null,
        interp: 'SUSCEPTIBLE',
        guideline: 'CLSI-M100-DEMO (>= 15 mm: S)',
      },
      {
        code: 'AST-26-00005',
        cultureId: cul1Id,
        organism: 'Staphylococcus aureus',
        drug: 'Erythromycin (15 µg)',
        method: 'KIRBY_BAUER_DISC',
        zone: 12.0,
        mic: null,
        interp: 'RESISTANT',
        guideline: 'CLSI-M100-DEMO (<= 13 mm: R)',
      },
    ];

    for (const a of astRecords) {
      const exists = await client.query('SELECT 1 FROM ast_records WHERE ast_code = $1', [a.code]);
      if (!exists.rowCount || exists.rowCount === 0) {
        await client.query(
          `INSERT INTO ast_records (ast_code, culture_id, organism_identified, antibiotic_name, method, zone_diameter_mm, mic_value_ug_ml, interpretation, reference_guideline, technician_id, recorded_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() - INTERVAL '15 hours')`,
          [a.code, a.cultureId, a.organism, a.drug, a.method, a.zone, a.mic, a.interp, a.guideline, microId]
        );
      }
    }

    // 10. Seed Contamination Incident
    console.log('[SEED] Seeding contamination & quarantine record...');
    const incidentExists = await client.query('SELECT 1 FROM contamination_incidents WHERE incident_code = $1', ['CON-26-00001']);
    if (!incidentExists.rowCount || incidentExists.rowCount === 0) {
      await client.query(
        `INSERT INTO contamination_incidents (incident_code, sample_id, category, description, suspected_cause, corrective_action, status, reported_by, resolved_by, resolution_date)
         VALUES ($1, $2, 'MEDIA_CONTAMINATION', 'Atypical fungal growth observed along perimeter edge of uninoculated control plate from lot LOT-MAC-2025-X.', 'Environmental aerosol during agar preparation autoclave cooldown.', 'Batch quarantined, autoclave validation cycle performed, replacement media lot validated.', 'RESOLVED', $3, $4, NOW() - INTERVAL '5 days')`,
        ['CON-26-00001', sampleMap.get('SMP-26-00005')!, techId, adminId]
      );
    }

    // 11. Seed Review & Electronic Sign-off
    console.log('[SEED] Seeding electronic sign-off and QC approval...');
    const smp1Id = sampleMap.get('SMP-26-00001')!;
    const revExists = await client.query('SELECT 1 FROM reviews WHERE sample_id = $1', [smp1Id]);
    if (!revExists.rowCount || revExists.rowCount === 0) {
      await client.query(
        `INSERT INTO reviews (sample_id, stage, decision, comments, electronic_signature_hash, signer_name, signer_title, reviewer_id, reviewed_at)
         VALUES ($1, 'FINALIZED', 'APPROVE', 'Internal controls and ATCC reference strains checked. Full concordance with MSSA profile. Approved for clinical release.', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'Dr. Elena Rostova', 'Quality Assurance Manager', $2, NOW() - INTERVAL '10 hours')`,
        [smp1Id, reviewerId]
      );
    }

    // 12. Seed Report
    const rptExists = await client.query('SELECT 1 FROM reports WHERE report_code = $1', ['RPT-26-00001']);
    if (!rptExists.rowCount || rptExists.rowCount === 0) {
      await client.query(
        `INSERT INTO reports (report_code, sample_id, generated_by, report_type, pdf_filename, checksum_sha256, generated_at)
         VALUES ($1, $2, $3, 'FINAL_MICROBIOLOGY_REPORT', 'report_SMP-26-00001.pdf', '7d2e48756bf0a62d08a543ef69b329486c9b5314782bbcd3d80e14a1c6a28790', NOW() - INTERVAL '9 hours')`,
        ['RPT-26-00001', smp1Id, reviewerId]
      );
    }

    // 13. Seed Audit Trail Logs
    console.log('[SEED] Seeding immutable master audit logs...');
    const auditLogs = [
      { action: 'SAMPLE_ACCESSIONED', entityType: 'sample', entityId: smp1Id, user: 'tech@microlims.lab', note: 'Specimen received in good order. Accession number generated.' },
      { action: 'CULTURE_INOCULATED', entityType: 'culture', entityId: cul1Id, user: 'tech@microlims.lab', note: 'Inoculated on 5% Sheep Blood Agar lot LOT-BA-2026-04.' },
      { action: 'INCUBATION_STARTED', entityType: 'incubation', entityId: 'INC-26-00001', user: 'tech@microlims.lab', note: 'Chamber temperature set to 37.0°C Aerobic.' },
      { action: 'MORPHOLOGY_RECORDED', entityType: 'observation', entityId: cul1Id, user: 'micro@microlims.lab', note: 'Beta-hemolytic golden colonies identified.' },
      { action: 'AST_PANEL_ENTERED', entityType: 'ast', entityId: cul1Id, user: 'micro@microlims.lab', note: 'Kirby-Bauer panel evaluated per CLSI demo standards.' },
      { action: 'RESULT_SUBMITTED_FOR_REVIEW', entityType: 'review', entityId: smp1Id, user: 'micro@microlims.lab', note: 'Work verified by microbiologist and submitted to QC.' },
      { action: 'ELECTRONIC_SIGN_OFF_COMPLETED', entityType: 'review', entityId: smp1Id, user: 'reviewer@microlims.lab', note: 'Cryptographic sign-off authorized by Dr. Elena Rostova.' },
    ];

    for (const a of auditLogs) {
      const uId = userMap.get(a.user)!;
      await client.query(
        `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, new_state, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, '127.0.0.1', 'MicroLIMS-Seeder/1.0')`,
        [uId, a.user, a.action, a.entityType, a.entityId, JSON.stringify({ summary: a.note })]
      );
    }

    await client.query('COMMIT');
    console.log('[SEED] Database successfully populated with realistic synthetic microbiology demo dataset!');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[SEED] Database seeding failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED] Fatal error during seeding:', err);
      process.exit(1);
    });
}
