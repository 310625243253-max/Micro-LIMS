import { query } from '../../db/index.js';
import { Observation, GrowthStatus, Hemolysis } from '../../types/index.js';
import { ObservationQueryDto } from './observation.dto.js';

export class ObservationRepository {
  async create(data: {
    cultureId: string;
    growthDetected: boolean;
    growthStatus: GrowthStatus;
    colonyMorphology?: string | null;
    pigmentation?: string | null;
    hemolysis: Hemolysis;
    colonyCountCfu?: string | null;
    observedBy: string;
    notes?: string | null;
  }): Promise<Observation> {
    const res = await query(
      `INSERT INTO observations (
        culture_id, growth_detected, growth_status, colony_morphology,
        pigmentation, hemolysis, colony_count_cfu, observed_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.cultureId,
        data.growthDetected,
        data.growthStatus,
        data.colonyMorphology || null,
        data.pigmentation || null,
        data.hemolysis,
        data.colonyCountCfu || null,
        data.observedBy,
        data.notes || null,
      ]
    );

    return this.findById(res.rows[0].id) as Promise<Observation>;
  }

  async findById(id: string): Promise<Observation | null> {
    const res = await query(
      `SELECT o.*, u.first_name || ' ' || u.last_name as observed_by_name
       FROM observations o
       LEFT JOIN users u ON o.observed_by = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapObservation(res.rows[0]);
  }

  async findByCultureId(cultureId: string): Promise<Observation[]> {
    const res = await query(
      `SELECT o.*, u.first_name || ' ' || u.last_name as observed_by_name
       FROM observations o
       LEFT JOIN users u ON o.observed_by = u.id
       WHERE o.culture_id = $1
       ORDER BY o.observed_at ASC`,
      [cultureId]
    );

    return res.rows.map(this.mapObservation);
  }

  async findAll(params: ObservationQueryDto): Promise<{ observations: Observation[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.cultureId) {
      conditions.push(`o.culture_id = $${idx}`);
      values.push(params.cultureId);
      idx++;
    }

    if (params.growthDetected !== undefined) {
      conditions.push(`o.growth_detected = $${idx}`);
      values.push(params.growthDetected);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT count(*) as total FROM observations o ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT o.*, u.first_name || ' ' || u.last_name as observed_by_name
       FROM observations o
       LEFT JOIN users u ON o.observed_by = u.id
       ${whereClause}
       ORDER BY o.observed_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      observations: dataRes.rows.map(this.mapObservation),
      total,
    };
  }

  private mapObservation(row: any): Observation {
    return {
      id: row.id,
      culture_id: row.culture_id,
      growth_detected: Boolean(row.growth_detected),
      growth_status: row.growth_status,
      colony_morphology: row.colony_morphology,
      pigmentation: row.pigmentation,
      hemolysis: row.hemolysis,
      colony_count_cfu: row.colony_count_cfu,
      observed_at: new Date(row.observed_at),
      observed_by: row.observed_by,
      observed_by_name: row.observed_by_name,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
