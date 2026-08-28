import { query } from '../db/index.js';

export interface AuditParams {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: any;
  newState?: any;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Persist an immutable audit log entry into the PostgreSQL audit trail
 */
export async function recordAuditLog(params: AuditParams): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (
        user_id, user_email, action, entity_type, entity_id, 
        previous_state, new_state, reason, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        params.userId || null,
        params.userEmail || null,
        params.action,
        params.entityType,
        params.entityId,
        params.previousState ? JSON.stringify(params.previousState) : null,
        params.newState ? JSON.stringify(params.newState) : null,
        params.reason || null,
        params.ipAddress || null,
        params.userAgent || null,
      ]
    );
  } catch (err: any) {
    console.error('[AUDIT] Failed to record audit log:', err.message);
  }
}
