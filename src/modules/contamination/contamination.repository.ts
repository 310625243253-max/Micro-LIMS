import { query } from '../../db/index.js';
import { ContaminationIncident, ContaminationStatus, ContaminationCategory } from '../../types/index.js';
import { ContaminationQueryDto } from './contamination.dto.js';

export class ContaminationRepository {
  async create(data: {
    incidentCode: string;
    sampleId?: string | null;
    cultureId?: string | null;
    category: ContaminationCategory;
    description: string;
    suspectedCause?: string | null;
    correctiveAction?: string | null;
    status: ContaminationStatus;
    reportedBy: string;
  }): Promise<ContaminationIncident> {
    const res = await query(
      `INSERT INTO contamination_incidents (
        incident_code, sample_id, culture_id, category, description,
        suspected_cause, corrective_action, status, reported_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.incidentCode,
        data.sampleId || null,
        data.cultureId || null,
        data.category,
        data.description,
        data.suspectedCause || null,
        data.correctiveAction || null,
        data.status,
        data.reportedBy,
      ]
    );

    return this.findById(res.rows[0].id) as Promise<ContaminationIncident>;
  }

  async findById(id: string): Promise<ContaminationIncident | null> {
    const res = await query(
      `SELECT ci.*,
              u.first_name || ' ' || u.last_name as reported_by_name,
              ru.first_name || ' ' || ru.last_name as resolved_by_name
       FROM contamination_incidents ci
       LEFT JOIN users u ON ci.reported_by = u.id
       LEFT JOIN users ru ON ci.resolved_by = ru.id
       WHERE ci.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapIncident(res.rows[0]);
  }

  async findByCode(incidentCode: string): Promise<ContaminationIncident | null> {
    const res = await query(
      `SELECT ci.*,
              u.first_name || ' ' || u.last_name as reported_by_name,
              ru.first_name || ' ' || ru.last_name as resolved_by_name
       FROM contamination_incidents ci
       LEFT JOIN users u ON ci.reported_by = u.id
       LEFT JOIN users ru ON ci.resolved_by = ru.id
       WHERE UPPER(ci.incident_code) = UPPER($1)`,
      [incidentCode]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapIncident(res.rows[0]);
  }

  async findAll(params: ContaminationQueryDto): Promise<{ incidents: ContaminationIncident[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.sampleId) {
      conditions.push(`ci.sample_id = $${idx}`);
      values.push(params.sampleId);
      idx++;
    }

    if (params.cultureId) {
      conditions.push(`ci.culture_id = $${idx}`);
      values.push(params.cultureId);
      idx++;
    }

    if (params.status) {
      conditions.push(`ci.status = $${idx}`);
      values.push(params.status);
      idx++;
    }

    if (params.category) {
      conditions.push(`ci.category = $${idx}`);
      values.push(params.category);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*) as total FROM contamination_incidents ci ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT ci.*,
              u.first_name || ' ' || u.last_name as reported_by_name,
              ru.first_name || ' ' || ru.last_name as resolved_by_name
       FROM contamination_incidents ci
       LEFT JOIN users u ON ci.reported_by = u.id
       LEFT JOIN users ru ON ci.resolved_by = ru.id
       ${whereClause}
       ORDER BY ci.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      incidents: dataRes.rows.map(this.mapIncident),
      total,
    };
  }

  async update(
    id: string,
    fields: {
      status?: ContaminationStatus;
      suspectedCause?: string | null;
      correctiveAction?: string | null;
      resolvedBy?: string | null;
      resolutionDate?: Date | null;
    }
  ): Promise<ContaminationIncident | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fields.status !== undefined) {
      setClauses.push(`status = $${idx++}`);
      values.push(fields.status);
    }
    if (fields.suspectedCause !== undefined) {
      setClauses.push(`suspected_cause = $${idx++}`);
      values.push(fields.suspectedCause);
    }
    if (fields.correctiveAction !== undefined) {
      setClauses.push(`corrective_action = $${idx++}`);
      values.push(fields.correctiveAction);
    }
    if (fields.resolvedBy !== undefined) {
      setClauses.push(`resolved_by = $${idx++}`);
      values.push(fields.resolvedBy);
    }
    if (fields.resolutionDate !== undefined) {
      setClauses.push(`resolution_date = $${idx++}`);
      values.push(fields.resolutionDate);
    }

    if (setClauses.length === 0) return this.findById(id);

    setClauses.push('updated_at = NOW()');
    values.push(id);

    await query(
      `UPDATE contamination_incidents
       SET ${setClauses.join(', ')}
       WHERE id = $${idx}`,
      values
    );

    return this.findById(id);
  }

  async countActiveIncidentsForSample(sampleId: string): Promise<number> {
    const res = await query(
      `SELECT count(*) as total
       FROM contamination_incidents
       WHERE sample_id = $1 AND status != 'RESOLVED'`,
      [sampleId]
    );
    return parseInt(res.rows[0]?.total || '0', 10);
  }

  private mapIncident(row: any): ContaminationIncident {
    return {
      id: row.id,
      incident_code: row.incident_code,
      sample_id: row.sample_id,
      culture_id: row.culture_id,
      detection_date: new Date(row.detection_date),
      category: row.category,
      description: row.description,
      suspected_cause: row.suspected_cause,
      corrective_action: row.corrective_action,
      status: row.status,
      reported_by: row.reported_by,
      reported_by_name: row.reported_by_name,
      resolved_by: row.resolved_by,
      resolved_by_name: row.resolved_by_name,
      resolution_date: row.resolution_date ? new Date(row.resolution_date) : null,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
