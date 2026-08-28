import { TestRepository } from './test.repository.js';
import { CultureRepository } from '../cultures/culture.repository.js';
import { nextTestCode } from '../../utils/identifiers.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import { CreateTestDto, TestQueryDto } from './test.dto.js';
import { TestRecord, UserRole } from '../../types/index.js';

export class TestService {
  private testRepo: TestRepository;
  private cultureRepo: CultureRepository;

  constructor() {
    this.testRepo = new TestRepository();
    this.cultureRepo = new CultureRepository();
  }

  async createTest(
    dto: CreateTestDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<TestRecord> {
    const culture = await this.cultureRepo.findById(dto.cultureId);
    if (!culture) {
      throw new Error(`Culture '${dto.cultureId}' not found`);
    }

    const testCode = await nextTestCode();

    const test = await this.testRepo.create({
      testCode,
      cultureId: dto.cultureId,
      testName: dto.testName,
      method: dto.method,
      rawResult: dto.rawResult,
      interpretation: dto.interpretation,
      performedBy: user.userId,
      notes: dto.notes,
    });

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'TEST_PERFORMED',
      entityType: 'test',
      entityId: test.id,
      newState: {
        testCode: test.test_code,
        cultureCode: culture.culture_code,
        testName: test.test_name,
        result: test.raw_result,
        interpretation: test.interpretation,
      },
      reason: `Biochemical test performed: ${dto.testName}`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return test;
  }

  async getTestById(id: string): Promise<TestRecord> {
    const test = await this.testRepo.findById(id);
    if (!test) throw new Error(`Test '${id}' not found`);
    return test;
  }

  async getTestsByCulture(cultureId: string): Promise<TestRecord[]> {
    return this.testRepo.findByCultureId(cultureId);
  }

  async listTests(query: TestQueryDto): Promise<{ tests: TestRecord[]; total: number }> {
    return this.testRepo.findAll(query);
  }
}
