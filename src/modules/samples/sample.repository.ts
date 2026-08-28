import { query, getClient } from '../../db/index.js';
import { Sample, SampleStatus } from '../../types/index.js';
import { SampleQueryDto } from './sample.dto.js';

export class SampleRepository {
  async create(data: {
    accessionNumber: string;
    patientSyntheticId: string;
    patientSyntheticName?: string | null;
    sampleType: string;
    collectionSite: string;
    priority: string;
    status: SampleStatus;
    collectedAt: Date;
    accessionedBy: string;
    clinicalNotes?: string | null;
  }): Promise<Sample> {
    const res = await query(
      `INSERT INTO samples (
        accession_number, patient_synthetic_id, patient_synthetic_name,
        sample_type, collection_site, priority, status,
        collected_at, accessioned_by, clinical_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.accessionNumber,
        data.patientSyntheticId,
        data.patientSyntheticName || null,
        data.sampleType,
        data.collectionSite,
        data.priority,
        data.status,
        data.collectedAt,
        data.accessionedBy,
        data.clinicalNotes || null,
      ]
    );

    return this.mapSample(res.rows[0]);
  }

  async findById(id: string): Promise<Sample | null> {
    const res = await query(
      `SELECT s.*, u.first_name || ' ' || u.last_name AS accessioned_by_name
       FROM samples s
       LEFT JOIN users u ON s.accessioned_by = u.id
       WHERE s.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapSample(res.rows[0]);
  }

  async findByAccessionNumber(accessionNumber: string): Promise<Sample | null> {
    const res = await query(
      `SELECT s.*, u.first_name || ' ' || u.last_name AS accessioned_by_name
       FROM samples s
       LEFT JOIN users u ON s.accessioned_by = u.id
       WHERE UPPER(s.accession_number) = UPPER($1)`,
      [accessionNumber]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapSample(res.rows[0]);
  }

  async findAll(params: SampleQueryDto): Promise<{ samples: Sample[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.search) {
      conditions.push(`(
        s.accession_number ILIKE $${idx} OR 
        s.patient_synthetic_id ILIKE $${idx} OR 
        s.patient_synthetic_name ILIKE $${idx} OR
        s.collection_site ILIKE $${idx}
      )`);
      values.push(`%${params.search}%`);
      idx++;
    }

    if (params.status) {
      conditions.push(`s.status = $${idx}`);
      values.push(params.status);
      idx++;
    }

    if (params.priority) {
      conditions.push(`s.priority = $${idx}`);
      values.push(params.priority);
      idx++;
    }

    if (params.sampleType) {
      conditions.push(`s.sample_type = $${idx}`);
      values.push(params.sampleType);
      idx++;
    }

    if (params.startDate) {
      conditions.push(`s.collected_at >= $${idx}`);
      values.push(new Date(params.startDate));
      idx++;
    }

    if (params.endDate) {
      conditions.push(`s.collected_at <= $${idx}`);
      values.push(new Date(params.endDate));
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countRes = await query(
      `SELECT count(*) as total FROM samples s ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Sorting & Pagination
    const validSortCols: Record<string, string> = {
      created_at: 's.created_at',
      collected_at: 's.collected_at',
      accession_number: 's.accession_number',
      priority: 's.priority',
      status: 's.status',
    };
    const sortCol = validSortCols[params.sortBy] || 's.created_at';
    const sortDir = params.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (params.page - 1) * params.limit;

    const dataRes = await query(
      `SELECT s.*, u.first_name || ' ' || u.last_name AS accessioned_by_name
       FROM samples s
       LEFT JOIN users u ON s.accessioned_by = u.id
       ${whereClause}
       ORDER BY ${sortCol} ${sortDir}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      samples: dataRes.rows.map((r) => this.mapSample(r)),
      total,
    };
  }

  async update(id: string, fields: Partial<Sample>): Promise<Sample | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fields.patient_synthetic_id !== undefined) {
      setClauses.push(`patient_synthetic_id = $${idx++}`);
      values.push(fields.patient_synthetic_id);
    }
    if (fields.patient_synthetic_name !== undefined) {
      setClauses.push(`patient_synthetic_name = $${idx++}`);
      values.push(fields.patient_synthetic_name);
    }
    if (fields.sample_type !== undefined) {
      setClauses.push(`sample_type = $${idx++}`);
      values.push(fields.sample_type);
    }
    if (fields.collection_site !== undefined) {
      setClauses.push(`collection_site = $${idx++}`);
      values.push(fields.collection_site);
    }
    if (fields.priority !== undefined) {
      setClauses.push(`priority = $${idx++}`);
      values.push(fields.priority);
    }
    if (fields.clinical_notes !== undefined) {
      setClauses.push(`clinical_notes = $${idx++}`);
      values.push(fields.clinical_notes);
    }
    if (fields.quarantined !== undefined) {
      setClauses.push(`quarantined = $${idx++}`);
      values.push(fields.quarantined);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE samples
       SET ${setClauses.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      values
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.findById(id);
  }

  async updateStatus(id: string, status: SampleStatus): Promise<Sample | null> {
    const res = await query(
      `UPDATE samples
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.findById(id);
  }

  async setQuarantine(id: string, quarantined: boolean): Promise<Sample | null> {
    const res = await query(
      `UPDATE samples
       SET quarantined = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quarantined, id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.findById(id);
  }

  async getSampleLineage(sampleId: string): Promise<any> {
    const sample = await this.findById(sampleId);
    if (!sample) return null;

    // Fetch cultures and media
    const culturesRes = await query(
      `SELECT c.*, ml.lot_number as media_lot_number, ml.media_name, u.first_name || ' ' || u.last_name as inoculated_by_name
       FROM cultures c
       LEFT JOIN media_lots ml ON c.media_lot_id = ml.id
       LEFT JOIN users u ON c.inoculated_by = u.id
       WHERE c.sample_id = $1
       ORDER BY c.created_at ASC`,
      [sampleId]
    );
    const cultures = culturesRes.rows;
    const cultureIds = cultures.map((c: any) => c.id);

    // Fetch incubations, observations, tests, AST records
    let incubations: any[] = [];
    let observations: any[] = [];
    let tests: any[] = [];
    let astRecords: any[] = [];

    if (cultureIds.length > 0) {
      const placeholders = cultureIds.map((_, i) => `$${i + 1}`).join(', ');

      const incRes = await query(
        `SELECT i.*, c.culture_code
         FROM incubations i
         JOIN cultures c ON i.culture_id = c.id
         WHERE i.culture_id IN (${placeholders})
         ORDER BY i.started_at ASC`,
        cultureIds
      );
      incubations = incRes.rows;

      const obsRes = await query(
        `SELECT o.*, c.culture_code, u.first_name || ' ' || u.last_name as observed_by_name
         FROM observations o
         JOIN cultures c ON o.culture_id = c.id
         LEFT JOIN users u ON o.observed_by = u.id
         WHERE o.culture_id IN (${placeholders})
         ORDER BY o.observed_at ASC`,
        cultureIds
      );
      observations = obsRes.rows;

      const testsRes = await query(
        `SELECT t.*, c.culture_code, u.first_name || ' ' || u.last_name as performed_by_name
         FROM tests t
         JOIN cultures c ON t.culture_id = c.id
         LEFT JOIN users u ON t.performed_by = u.id
         WHERE t.culture_id IN (${placeholders})
         ORDER BY t.performed_at ASC`,
        cultureIds
      );
      tests = testsRes.rows;

      const astRes = await query(
        `SELECT a.*, c.culture_code, u.first_name || ' ' || u.last_name as technician_name
         FROM ast_records a
         JOIN cultures c ON a.culture_id = c.id
         LEFT JOIN users u ON a.technician_id = u.id
         WHERE a.culture_id IN (${placeholders})
         ORDER BY a.recorded_at ASC`,
        cultureIds
      );
      astRecords = astRes.rows;
    }

    // Incidents
    const incidentsRes = await query(
      `SELECT ci.*, u.first_name || ' ' || u.last_name as reported_by_name, ru.first_name || ' ' || ru.last_name as resolved_by_name
       FROM contamination_incidents ci
       LEFT JOIN users u ON ci.reported_by = u.id
       LEFT JOIN users ru ON ci.resolved_by = ru.id
       WHERE ci.sample_id = $1
       ORDER BY ci.created_at ASC`,
      [sampleId]
    );

    // Reviews
    const reviewsRes = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as reviewer_name
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       WHERE r.sample_id = $1
       ORDER BY r.created_at DESC`,
      [sampleId]
    );

    // Reports
    const reportsRes = await query(
      `SELECT rp.*, u.first_name || ' ' || u.last_name as generated_by_name
       FROM reports rp
       LEFT JOIN users u ON rp.generated_by = u.id
       WHERE rp.sample_id = $1
       ORDER BY rp.generated_at DESC`,
      [sampleId]
    );

    // Audit logs for this sample
    const auditRes = await query(
      `SELECT * FROM audit_logs
       WHERE entity_id = $1 OR reason ILIKE $2
       ORDER BY created_at ASC`,
      [sampleId, `%${sample.accession_number}%`]
    );

    return {
      sample,
      cultures,
      incubations,
      observations,
      tests,
      astRecords,
      incidents: incidentsRes.rows,
      reviews: reviewsRes.rows,
      reports: reportsRes.rows,
      auditLogs: auditRes.rows,
    };
  }

  private mapSample(row: any): Sample {
    return {
      id: row.id,
      accession_number: row.accession_number,
      patient_synthetic_id: row.patient_synthetic_id,
      patient_synthetic_name: row.patient_synthetic_name,
      sample_type: row.sample_type,
      collection_site: row.collection_site,
      priority: row.priority,
      status: row.status,
      collected_at: new Date(row.collected_at),
      received_at: new Date(row.received_at),
      accessioned_by: row.accessioned_by,
      accessioned_by_name: row.accessioned_by_name,
      clinical_notes: row.clinical_notes,
      quarantined: Boolean(row.quarantined),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
