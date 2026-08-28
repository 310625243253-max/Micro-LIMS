import { query } from '../../db/index.js';

export interface DashboardMetrics {
  totalSamples: number;
  samplesToday: number;
  activeCultures: number;
  runningIncubations: number;
  dueIncubations: number;
  overdueIncubations: number;
  pendingTests: number;
  pendingReviews: number;
  contaminationIncidents: number;
  quarantinedSamples: number;
  samplesByPriority: { priority: string; count: number }[];
  samplesByStatus: { status: string; count: number }[];
  samplesByType: { type: string; count: number }[];
}

export class DashboardRepository {
  async getMetrics(): Promise<DashboardMetrics> {
    const samplesCountRes = await query(`
      SELECT 
        count(*) as total,
        count(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
        count(*) FILTER (WHERE quarantined = TRUE) as quarantined,
        count(*) FILTER (WHERE status = 'UNDER_REVIEW') as pending_reviews
      FROM samples
    `);

    const culturesCountRes = await query(`
      SELECT count(*) as active
      FROM cultures
      WHERE status IN ('INOCULATED', 'INCUBATING', 'OBSERVED')
    `);

    const incubationsCountRes = await query(`
      SELECT 
        count(*) FILTER (WHERE status = 'RUNNING') as running,
        count(*) FILTER (WHERE status = 'DUE') as due,
        count(*) FILTER (WHERE status = 'OVERDUE') as overdue
      FROM incubations
    `);

    const testsCountRes = await query(`
      SELECT count(*) as pending
      FROM tests
      WHERE status != 'COMPLETED'
    `);

    const contaminationCountRes = await query(`
      SELECT count(*) as active
      FROM contamination_incidents
      WHERE status != 'RESOLVED'
    `);

    const priorityRes = await query(`
      SELECT priority, count(*) as count
      FROM samples
      GROUP BY priority
      ORDER BY count DESC
    `);

    const statusRes = await query(`
      SELECT status, count(*) as count
      FROM samples
      GROUP BY status
      ORDER BY count DESC
    `);

    const typeRes = await query(`
      SELECT sample_type as type, count(*) as count
      FROM samples
      GROUP BY sample_type
      ORDER BY count DESC
    `);

    const sRow = samplesCountRes.rows[0] || {};
    const cRow = culturesCountRes.rows[0] || {};
    const iRow = incubationsCountRes.rows[0] || {};
    const tRow = testsCountRes.rows[0] || {};
    const conRow = contaminationCountRes.rows[0] || {};

    return {
      totalSamples: parseInt(sRow.total || '0', 10),
      samplesToday: parseInt(sRow.today || '0', 10),
      quarantinedSamples: parseInt(sRow.quarantined || '0', 10),
      pendingReviews: parseInt(sRow.pending_reviews || '0', 10),
      activeCultures: parseInt(cRow.active || '0', 10),
      runningIncubations: parseInt(iRow.running || '0', 10),
      dueIncubations: parseInt(iRow.due || '0', 10),
      overdueIncubations: parseInt(iRow.overdue || '0', 10),
      pendingTests: parseInt(tRow.pending || '0', 10),
      contaminationIncidents: parseInt(conRow.active || '0', 10),
      samplesByPriority: priorityRes.rows.map((r: any) => ({ priority: r.priority, count: parseInt(r.count, 10) })),
      samplesByStatus: statusRes.rows.map((r: any) => ({ status: r.status, count: parseInt(r.count, 10) })),
      samplesByType: typeRes.rows.map((r: any) => ({ type: r.type, count: parseInt(r.count, 10) })),
    };
  }

  async getRecentActivity(limit = 10): Promise<any[]> {
    const res = await query(
      `SELECT al.*, u.first_name || ' ' || u.last_name as user_name
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      action: r.action,
      entityType: r.entity_type,
      entityId: r.entity_id,
      userEmail: r.user_email,
      userName: r.user_name || r.user_email || 'System',
      newState: typeof r.new_state === 'string' ? JSON.parse(r.new_state) : r.new_state,
      reason: r.reason,
      createdAt: new Date(r.created_at),
    }));
  }
}
