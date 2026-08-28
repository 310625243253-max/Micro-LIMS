import { query } from '../../db/index.js';
import { MediaLot } from '../../types/index.js';
import { MediaLotQueryDto, CreateMediaLotDto } from './media.dto.js';

export class MediaRepository {
  async findAll(params: MediaLotQueryDto): Promise<{ mediaLots: MediaLot[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.search) {
      conditions.push(`(lot_number ILIKE $${idx} OR media_name ILIKE $${idx} OR manufacturer ILIKE $${idx})`);
      values.push(`%${params.search}%`);
      idx++;
    }

    if (params.status) {
      conditions.push(`status = $${idx}`);
      values.push(params.status);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*) as total FROM media_lots ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT * FROM media_lots
       ${whereClause}
       ORDER BY received_date DESC, lot_number ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      mediaLots: dataRes.rows.map(this.mapMediaLot),
      total,
    };
  }

  async findById(id: string): Promise<MediaLot | null> {
    const res = await query(`SELECT * FROM media_lots WHERE id = $1`, [id]);
    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapMediaLot(res.rows[0]);
  }

  async findByLotNumber(lotNumber: string): Promise<MediaLot | null> {
    const res = await query(`SELECT * FROM media_lots WHERE UPPER(lot_number) = UPPER($1)`, [lotNumber]);
    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapMediaLot(res.rows[0]);
  }

  async create(data: CreateMediaLotDto): Promise<MediaLot> {
    const res = await query(
      `INSERT INTO media_lots (
        lot_number, media_name, manufacturer, received_date, expiry_date, status, storage_conditions, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.lotNumber,
        data.mediaName,
        data.manufacturer,
        data.receivedDate || new Date().toISOString().split('T')[0],
        data.expiryDate,
        data.status || 'ACTIVE',
        data.storageConditions || null,
        data.notes || null,
      ]
    );
    return this.mapMediaLot(res.rows[0]);
  }

  async updateStatus(id: string, status: string): Promise<MediaLot | null> {
    const res = await query(
      `UPDATE media_lots SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapMediaLot(res.rows[0]);
  }

  private mapMediaLot(row: any): MediaLot {
    return {
      id: row.id,
      lot_number: row.lot_number,
      media_name: row.media_name,
      manufacturer: row.manufacturer,
      received_date: typeof row.received_date === 'string' ? row.received_date : new Date(row.received_date).toISOString().split('T')[0],
      expiry_date: typeof row.expiry_date === 'string' ? row.expiry_date : new Date(row.expiry_date).toISOString().split('T')[0],
      status: row.status,
      storage_conditions: row.storage_conditions,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
