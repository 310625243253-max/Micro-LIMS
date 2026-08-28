import { query } from '../../db/index.js';
import { TestRecord } from '../../types/index.js';
import { TestQueryDto } from './test.dto.js';

export class TestRepository {
  async create(data: {
    testCode: string;
    cultureId: string;
    testName: string;
    method: string;
    rawResult: string;
    interpretation: string;
    performedBy: string;
    notes?: string | null;
  }): Promise<TestRecord> {
    const res = await query(
      `INSERT INTO tests (
        test_code, culture_id, test_name, method, raw_result,
        interpretation, performed_by, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'COMPLETED')
      RETURNING *`,
      [
        data.testCode,
        data.cultureId,
        data.testName,
        data.method,
        data.rawResult,
        data.interpretation,
        data.performedBy,
        data.notes || null,
      ]
    );

    return this.findById(res.rows[0].id) as Promise<TestRecord>;
  }

  async findById(id: string): Promise<TestRecord | null> {
    const res = await query(
      `SELECT t.*, u.first_name || ' ' || u.last_name as performed_by_name
       FROM tests t
       LEFT JOIN users u ON t.performed_by = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapTest(res.rows[0]);
  }

  async findByCode(testCode: string): Promise<TestRecord | null> {
    const res = await query(
      `SELECT t.*, u.first_name || ' ' || u.last_name as performed_by_name
       FROM tests t
       LEFT JOIN users u ON t.performed_by = u.id
       WHERE UPPER(t.test_code) = UPPER($1)`,
      [testCode]
    );

    if (!res.rowCount || res.rowCount === 0) return null;
    return this.mapTest(res.rows[0]);
  }

  async findByCultureId(cultureId: string): Promise<TestRecord[]> {
    const res = await query(
      `SELECT t.*, u.first_name || ' ' || u.last_name as performed_by_name
       FROM tests t
       LEFT JOIN users u ON t.performed_by = u.id
       WHERE t.culture_id = $1
       ORDER BY t.performed_at ASC`,
      [cultureId]
    );

    return res.rows.map(this.mapTest);
  }

  async findAll(params: TestQueryDto): Promise<{ tests: TestRecord[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.cultureId) {
      conditions.push(`t.culture_id = $${idx}`);
      values.push(params.cultureId);
      idx++;
    }

    if (params.testName) {
      conditions.push(`t.test_name ILIKE $${idx}`);
      values.push(`%${params.testName}%`);
      idx++;
    }

    if (params.status) {
      conditions.push(`t.status = $${idx}`);
      values.push(params.status);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT count(*) as total FROM tests t ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const offset = (params.page - 1) * params.limit;
    const dataRes = await query(
      `SELECT t.*, u.first_name || ' ' || u.last_name as performed_by_name
       FROM tests t
       LEFT JOIN users u ON t.performed_by = u.id
       ${whereClause}
       ORDER BY t.performed_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, params.limit, offset]
    );

    return {
      tests: dataRes.rows.map(this.mapTest),
      total,
    };
  }

  private mapTest(row: any): TestRecord {
    return {
      id: row.id,
      test_code: row.test_code,
      culture_id: row.culture_id,
      test_name: row.test_name,
      method: row.method,
      raw_result: row.raw_result,
      interpretation: row.interpretation,
      performed_by: row.performed_by,
      performed_by_name: row.performed_by_name,
      performed_at: new Date(row.performed_at),
      status: row.status,
      notes: row.notes,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
