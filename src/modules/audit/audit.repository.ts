import { query } from '../../db/index.js';
import { AuditLog } from '../../types/index.js';
import { AuditLogQueryDto } from './audit.dto.js';

export class AuditRepository {
  async findAll(params: AuditLogQueryDto): Promise<{ logs: AuditLog[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.search) {
      conditions.push(`(
        action ILIKE $${idx} OR
        user_email ILIKE $${idx} OR
        entity_type ILIKE $${idx} OR
        entity_id ILIKE $${idx} OR
        reason ILIKE $${idx}
      )`);
      values.push(`%${params.search}%`);
      idx++;
    }

    if (params.userId) {
      conditions.push(`user_id = $${idx}`);
      values.push(params.userId);
      idx++;
    }

    if (params.action) {
      conditions.push(`action = $${idx}`);
      values.push(params.action);
      idx++;
    }

    if (params.entityType) {
      conditions.push(`entity_type = $${idx}`);
      values.push(params.entityType);
      idx++;
    }

    if (params.entityId) {
      conditions.push(`entity_id = $${idx}`);
      values.push(params.entityId);
      idx++;
    }

    if (params.startDate) {
      conditions.push(`created_at >= $${idx}`);
      values.push(new Date(params.startDate));
      idx++;
    }

    if (params.endDate) {
      conditions.push(`created_at <= $${idx}`);
      values.push(new Date(params.endDate));
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*) as total FROM audit_logs ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT * FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      logs: dataRes.rows.map(this.mapAuditLog),
      total,
    };
  }

  async findById(id: string): Promise<AuditLog | null> {
    const res = await query(`SELECT * FROM audit_logs WHERE id = $1`, [id]);
    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapAuditLog(res.rows[0]);
  }

  private mapAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      user_id: row.user_id,
      user_email: row.user_email,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      previous_state: typeof row.previous_state === 'string' ? JSON.parse(row.previous_state) : row.previous_state,
      new_state: typeof row.new_state === 'string' ? JSON.parse(row.new_state) : row.new_state,
      reason: row.reason,
      ip_address: row.ip_address,
      user_agent: row.user_agent,
      created_at: new Date(row.created_at),
    };
  }
}
