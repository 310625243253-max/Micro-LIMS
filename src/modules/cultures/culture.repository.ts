import { query } from '../../db/index.js';
import { Culture, CultureStatus, InoculationMethod } from '../../types/index.js';
import { CultureQueryDto } from './culture.dto.js';

export class CultureRepository {
  async create(data: {
    cultureCode: string;
    sampleId: string;
    mediaLotId?: string | null;
    mediaType: string;
    inoculationMethod: InoculationMethod;
    inoculatedBy: string;
    status: CultureStatus;
    notes?: string | null;
  }): Promise<Culture> {
    const res = await query(
      `INSERT INTO cultures (
        culture_code, sample_id, media_lot_id, media_type,
        inoculation_method, inoculated_by, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.cultureCode,
        data.sampleId,
        data.mediaLotId || null,
        data.mediaType,
        data.inoculationMethod,
        data.inoculatedBy,
        data.status,
        data.notes || null,
      ]
    );

    return this.findById(res.rows[0].id) as Promise<Culture>;
  }

  async findById(id: string): Promise<Culture | null> {
    const res = await query(
      `SELECT c.*, s.accession_number as sample_accession_number,
              ml.lot_number as media_lot_number,
              u.first_name || ' ' || u.last_name as inoculated_by_name
       FROM cultures c
       JOIN samples s ON c.sample_id = s.id
       LEFT JOIN media_lots ml ON c.media_lot_id = ml.id
       LEFT JOIN users u ON c.inoculated_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapCulture(res.rows[0]);
  }

  async findByCode(cultureCode: string): Promise<Culture | null> {
    const res = await query(
      `SELECT c.*, s.accession_number as sample_accession_number,
              ml.lot_number as media_lot_number,
              u.first_name || ' ' || u.last_name as inoculated_by_name
       FROM cultures c
       JOIN samples s ON c.sample_id = s.id
       LEFT JOIN media_lots ml ON c.media_lot_id = ml.id
       LEFT JOIN users u ON c.inoculated_by = u.id
       WHERE UPPER(c.culture_code) = UPPER($1)`,
      [cultureCode]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapCulture(res.rows[0]);
  }

  async findAll(params: CultureQueryDto): Promise<{ cultures: Culture[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.sampleId) {
      conditions.push(`c.sample_id = $${idx}`);
      values.push(params.sampleId);
      idx++;
    }

    if (params.status) {
      conditions.push(`c.status = $${idx}`);
      values.push(params.status);
      idx++;
    }

    if (params.mediaLotId) {
      conditions.push(`c.media_lot_id = $${idx}`);
      values.push(params.mediaLotId);
      idx++;
    }

    if (params.search) {
      conditions.push(`(
        c.culture_code ILIKE $${idx} OR 
        s.accession_number ILIKE $${idx} OR 
        c.media_type ILIKE $${idx} OR
        ml.lot_number ILIKE $${idx}
      )`);
      values.push(`%${params.search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT count(*) as total
       FROM cultures c
       JOIN samples s ON c.sample_id = s.id
       LEFT JOIN media_lots ml ON c.media_lot_id = ml.id
       ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT c.*, s.accession_number as sample_accession_number,
              ml.lot_number as media_lot_number,
              u.first_name || ' ' || u.last_name as inoculated_by_name
       FROM cultures c
       JOIN samples s ON c.sample_id = s.id
       LEFT JOIN media_lots ml ON c.media_lot_id = ml.id
       LEFT JOIN users u ON c.inoculated_by = u.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      cultures: dataRes.rows.map(this.mapCulture),
      total,
    };
  }

  async updateStatus(id: string, status: CultureStatus, notes?: string | null): Promise<Culture | null> {
    const res = await query(
      `UPDATE cultures
       SET status = $1, notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, notes || null, id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.findById(id);
  }

  private mapCulture(row: any): Culture {
    return {
      id: row.id,
      culture_code: row.culture_code,
      sample_id: row.sample_id,
      sample_accession_number: row.sample_accession_number,
      media_lot_id: row.media_lot_id,
      media_lot_number: row.media_lot_number,
      media_type: row.media_type,
      inoculation_method: row.inoculation_method,
      inoculated_at: new Date(row.inoculated_at),
      inoculated_by: row.inoculated_by,
      inoculated_by_name: row.inoculated_by_name,
      status: row.status,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
