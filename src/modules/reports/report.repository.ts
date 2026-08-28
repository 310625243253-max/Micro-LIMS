import { query } from '../../db/index.js';
import { ReportRecord } from '../../types/index.js';

export class ReportRepository {
  async create(data: {
    reportCode: string;
    sampleId: string;
    generatedBy: string;
    reportType: string;
    pdfFilename: string;
    checksumSha256: string;
  }): Promise<ReportRecord> {
    const res = await query(
      `INSERT INTO reports (
        report_code, sample_id, generated_by, report_type, pdf_filename, checksum_sha256
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        data.reportCode,
        data.sampleId,
        data.generatedBy,
        data.reportType,
        data.pdfFilename,
        data.checksumSha256,
      ]
    );

    return this.findById(res.rows[0].id) as Promise<ReportRecord>;
  }

  async findById(id: string): Promise<ReportRecord | null> {
    const res = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as generated_by_name, s.accession_number
       FROM reports r
       LEFT JOIN users u ON r.generated_by = u.id
       JOIN samples s ON r.sample_id = s.id
       WHERE r.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapReport(res.rows[0]);
  }

  async findByCode(reportCode: string): Promise<ReportRecord | null> {
    const res = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as generated_by_name, s.accession_number
       FROM reports r
       LEFT JOIN users u ON r.generated_by = u.id
       JOIN samples s ON r.sample_id = s.id
       WHERE UPPER(r.report_code) = UPPER($1)`,
      [reportCode]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapReport(res.rows[0]);
  }

  async findByChecksum(checksum: string): Promise<ReportRecord | null> {
    const res = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as generated_by_name, s.accession_number
       FROM reports r
       LEFT JOIN users u ON r.generated_by = u.id
       JOIN samples s ON r.sample_id = s.id
       WHERE LOWER(r.checksum_sha256) = LOWER($1)`,
      [checksum]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapReport(res.rows[0]);
  }

  async findBySampleId(sampleId: string): Promise<ReportRecord[]> {
    const res = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as generated_by_name, s.accession_number
       FROM reports r
       LEFT JOIN users u ON r.generated_by = u.id
       JOIN samples s ON r.sample_id = s.id
       WHERE r.sample_id = $1
       ORDER BY r.generated_at DESC`,
      [sampleId]
    );

    return res.rows.map(this.mapReport);
  }

  async findAll(limit = 50, offset = 0): Promise<{ reports: ReportRecord[]; total: number }> {
    const countRes = await query(`SELECT count(*) as total FROM reports`);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const dataRes = await query(
      `SELECT r.*, u.first_name || ' ' || u.last_name as generated_by_name, s.accession_number
       FROM reports r
       LEFT JOIN users u ON r.generated_by = u.id
       JOIN samples s ON r.sample_id = s.id
       ORDER BY r.generated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return {
      reports: dataRes.rows.map(this.mapReport),
      total,
    };
  }

  private mapReport(row: any): ReportRecord {
    return {
      id: row.id,
      report_code: row.report_code,
      sample_id: row.sample_id,
      generated_by: row.generated_by,
      report_type: row.report_type,
      pdf_filename: row.pdf_filename,
      checksum_sha256: row.checksum_sha256,
      generated_at: new Date(row.generated_at),
    };
  }
}
