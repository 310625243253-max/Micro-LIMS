import { query } from '../../db/index.js';
import { ReviewRecord, ReviewStage, ReviewDecision } from '../../types/index.js';
import { ReviewQueryDto } from './review.dto.js';

export class ReviewRepository {
  async create(data: {
    sampleId: string;
    stage: ReviewStage;
    decision: ReviewDecision;
    comments?: string | null;
    rejectionReason?: string | null;
    amendmentReason?: string | null;
    electronicSignatureHash: string;
    signerName: string;
    signerTitle: string;
    reviewerId: string;
    reviewedAt: Date;
  }): Promise<ReviewRecord> {
    const res = await query(
      `INSERT INTO reviews (
        sample_id, stage, decision, comments, rejection_reason,
        amendment_reason, electronic_signature_hash, signer_name,
        signer_title, reviewer_id, reviewed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.sampleId,
        data.stage,
        data.decision,
        data.comments || null,
        data.rejectionReason || null,
        data.amendmentReason || null,
        data.electronicSignatureHash,
        data.signerName,
        data.signerTitle,
        data.reviewerId,
        data.reviewedAt,
      ]
    );

    return this.findById(res.rows[0].id) as Promise<ReviewRecord>;
  }

  async findById(id: string): Promise<ReviewRecord | null> {
    const res = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as reviewer_name
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapReview(res.rows[0]);
  }

  async findBySampleId(sampleId: string): Promise<ReviewRecord[]> {
    const res = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as reviewer_name
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       WHERE r.sample_id = $1
       ORDER BY r.created_at DESC`,
      [sampleId]
    );

    return res.rows.map(this.mapReview);
  }

  async findAll(params: ReviewQueryDto): Promise<{ reviews: ReviewRecord[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.sampleId) {
      conditions.push(`r.sample_id = $${idx}`);
      values.push(params.sampleId);
      idx++;
    }

    if (params.stage) {
      conditions.push(`r.stage = $${idx}`);
      values.push(params.stage);
      idx++;
    }

    if (params.decision) {
      conditions.push(`r.decision = $${idx}`);
      values.push(params.decision);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*) as total FROM reviews r ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as reviewer_name
       FROM reviews r
       LEFT JOIN users u ON r.reviewer_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      reviews: dataRes.rows.map(this.mapReview),
      total,
    };
  }

  async getPendingReviews(): Promise<any[]> {
    const res = await query(
      `SELECT s.*, u.first_name || ' ' || u.last_name as accessioned_by_name
       FROM samples s
       LEFT JOIN users u ON s.accessioned_by = u.id
       WHERE s.status = 'UNDER_REVIEW'
       ORDER BY s.created_at ASC`
    );

    return res.rows;
  }

  private mapReview(row: any): ReviewRecord {
    return {
      id: row.id,
      sample_id: row.sample_id,
      stage: row.stage,
      decision: row.decision,
      comments: row.comments,
      rejection_reason: row.rejection_reason,
      amendment_reason: row.amendment_reason,
      electronic_signature_hash: row.electronic_signature_hash,
      signer_name: row.signer_name,
      signer_title: row.signer_title,
      reviewer_id: row.reviewer_id,
      reviewed_at: new Date(row.reviewed_at),
      created_at: new Date(row.created_at),
    };
  }
}
