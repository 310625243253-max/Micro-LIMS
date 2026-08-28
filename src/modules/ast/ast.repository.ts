import { query } from '../../db/index.js';
import { AstRecord, AstMethod, AstInterpretation } from '../../types/index.js';
import { AstQueryDto } from './ast.dto.js';

export class AstRepository {
  async create(data: {
    astCode: string;
    cultureId: string;
    organismIdentified: string;
    antibioticName: string;
    method: AstMethod;
    zoneDiameterMm?: number | null;
    micValueUgMl?: number | null;
    interpretation: AstInterpretation;
    referenceGuideline: string;
    technicianId: string;
    notes?: string | null;
  }): Promise<AstRecord> {
    const res = await query(
      `INSERT INTO ast_records (
        ast_code, culture_id, organism_identified, antibiotic_name,
        method, zone_diameter_mm, mic_value_ug_ml, interpretation,
        reference_guideline, technician_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.astCode,
        data.cultureId,
        data.organismIdentified,
        data.antibioticName,
        data.method,
        data.zoneDiameterMm || null,
        data.micValueUgMl || null,
        data.interpretation,
        data.referenceGuideline,
        data.technicianId,
        data.notes || null,
      ]
    );

    return this.findById(res.rows[0].id) as Promise<AstRecord>;
  }

  async findById(id: string): Promise<AstRecord | null> {
    const res = await query(
      `SELECT a.*, u.first_name || ' ' || u.last_name as technician_name
       FROM ast_records a
       LEFT JOIN users u ON a.technician_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapAst(res.rows[0]);
  }

  async findByCode(astCode: string): Promise<AstRecord | null> {
    const res = await query(
      `SELECT a.*, u.first_name || ' ' || u.last_name as technician_name
       FROM ast_records a
       LEFT JOIN users u ON a.technician_id = u.id
       WHERE UPPER(a.ast_code) = UPPER($1)`,
      [astCode]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapAst(res.rows[0]);
  }

  async findByCultureId(cultureId: string): Promise<AstRecord[]> {
    const res = await query(
      `SELECT a.*, u.first_name || ' ' || u.last_name as technician_name
       FROM ast_records a
       LEFT JOIN users u ON a.technician_id = u.id
       WHERE a.culture_id = $1
       ORDER BY a.recorded_at ASC`,
      [cultureId]
    );

    return res.rows.map(this.mapAst);
  }

  async findAll(params: AstQueryDto): Promise<{ astRecords: AstRecord[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.cultureId) {
      conditions.push(`a.culture_id = $${idx}`);
      values.push(params.cultureId);
      idx++;
    }

    if (params.organismIdentified) {
      conditions.push(`a.organism_identified ILIKE $${idx}`);
      values.push(`%${params.organismIdentified}%`);
      idx++;
    }

    if (params.interpretation) {
      conditions.push(`a.interpretation = $${idx}`);
      values.push(params.interpretation);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*) as total FROM ast_records a ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT a.*, u.first_name || ' ' || u.last_name as technician_name
       FROM ast_records a
       LEFT JOIN users u ON a.technician_id = u.id
       ${whereClause}
       ORDER BY a.recorded_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      astRecords: dataRes.rows.map(this.mapAst),
      total,
    };
  }

  private mapAst(row: any): AstRecord {
    return {
      id: row.id,
      ast_code: row.ast_code,
      culture_id: row.culture_id,
      organism_identified: row.organism_identified,
      antibiotic_name: row.antibiotic_name,
      method: row.method,
      zone_diameter_mm: row.zone_diameter_mm !== null ? parseFloat(row.zone_diameter_mm) : null,
      mic_value_ug_ml: row.mic_value_ug_ml !== null ? parseFloat(row.mic_value_ug_ml) : null,
      interpretation: row.interpretation,
      reference_guideline: row.reference_guideline,
      technician_id: row.technician_id,
      technician_name: row.technician_name,
      recorded_at: new Date(row.recorded_at),
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
