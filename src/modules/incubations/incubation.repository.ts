import { query } from '../../db/index.js';
import { Incubation, IncubationStatus, Atmosphere } from '../../types/index.js';
import { IncubationQueryDto } from './incubation.dto.js';

export class IncubationRepository {
  async create(data: {
    incubationCode: string;
    cultureId: string;
    incubatorId: string;
    temperatureCelsius: number;
    atmosphere: Atmosphere;
    durationHours: number;
    startedAt: Date;
    expectedCompletionAt: Date;
    status: IncubationStatus;
    operatorNotes?: string | null;
  }): Promise<Incubation> {
    const res = await query(
      `INSERT INTO incubations (
        incubation_code, culture_id, incubator_id, temperature_celsius,
        atmosphere, duration_hours, started_at, expected_completion_at,
        status, operator_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.incubationCode,
        data.cultureId,
        data.incubatorId,
        data.temperatureCelsius,
        data.atmosphere,
        data.durationHours,
        data.startedAt,
        data.expectedCompletionAt,
        data.status,
        data.operatorNotes || null,
      ]
    );

    return this.findById(res.rows[0].id) as Promise<Incubation>;
  }

  async findById(id: string): Promise<Incubation | null> {
    const res = await query(
      `SELECT i.*, c.culture_code
       FROM incubations i
       JOIN cultures c ON i.culture_id = c.id
       WHERE i.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapIncubation(res.rows[0]);
  }

  async findByCode(incubationCode: string): Promise<Incubation | null> {
    const res = await query(
      `SELECT i.*, c.culture_code
       FROM incubations i
       JOIN cultures c ON i.culture_id = c.id
       WHERE UPPER(i.incubation_code) = UPPER($1)`,
      [incubationCode]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapIncubation(res.rows[0]);
  }

  async findAll(params: IncubationQueryDto): Promise<{ incubations: Incubation[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.cultureId) {
      conditions.push(`i.culture_id = $${idx}`);
      values.push(params.cultureId);
      idx++;
    }

    if (params.status) {
      conditions.push(`i.status = $${idx}`);
      values.push(params.status);
      idx++;
    }

    if (params.incubatorId) {
      conditions.push(`i.incubator_id = $${idx}`);
      values.push(params.incubatorId);
      idx++;
    }

    if (params.atmosphere) {
      conditions.push(`i.atmosphere = $${idx}`);
      values.push(params.atmosphere);
      idx++;
    }

    if (params.search) {
      conditions.push(`(
        i.incubation_code ILIKE $${idx} OR 
        c.culture_code ILIKE $${idx} OR 
        i.incubator_id ILIKE $${idx}
      )`);
      values.push(`%${params.search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT count(*) as total
       FROM incubations i
       JOIN cultures c ON i.culture_id = c.id
       ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT i.*, c.culture_code
       FROM incubations i
       JOIN cultures c ON i.culture_id = c.id
       ${whereClause}
       ORDER BY i.started_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      incubations: dataRes.rows.map(this.mapIncubation),
      total,
    };
  }

  async updateStatus(
    id: string,
    status: IncubationStatus,
    completedAt?: Date | null,
    operatorNotes?: string | null
  ): Promise<Incubation | null> {
    const res = await query(
      `UPDATE incubations
       SET status = $1,
           completed_at = COALESCE($2, completed_at),
           operator_notes = COALESCE($3, operator_notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, completedAt || null, operatorNotes || null, id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.findById(id);
  }

  /**
   * Idempotent sweep to update RUNNING incubations whose deadline has passed
   */
  async sweepOverdueIncubations(): Promise<{ updatedCount: number }> {
    // 1. Mark incubations past expected_completion_at by more than 2 hours as OVERDUE
    const overdueRes = await query(
      `UPDATE incubations
       SET status = 'OVERDUE', updated_at = NOW()
       WHERE status = 'RUNNING'
         AND expected_completion_at < (NOW() - INTERVAL '2 hours')
       RETURNING id`
    );

    // 2. Mark incubations whose deadline is now past (within 2 hours) as DUE
    const dueRes = await query(
      `UPDATE incubations
       SET status = 'DUE', updated_at = NOW()
       WHERE status = 'RUNNING'
         AND expected_completion_at <= NOW()
       RETURNING id`
    );

    return {
      updatedCount: (overdueRes.rowCount || 0) + (dueRes.rowCount || 0),
    };
  }

  private mapIncubation(row: any): Incubation {
    return {
      id: row.id,
      incubation_code: row.incubation_code,
      culture_id: row.culture_id,
      culture_code: row.culture_code,
      incubator_id: row.incubator_id,
      temperature_celsius: parseFloat(row.temperature_celsius),
      atmosphere: row.atmosphere,
      duration_hours: parseInt(row.duration_hours, 10),
      started_at: new Date(row.started_at),
      expected_completion_at: new Date(row.expected_completion_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
      status: row.status,
      operator_notes: row.operator_notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
