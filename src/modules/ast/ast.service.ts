import { AstRepository } from './ast.repository.js';
import { CultureRepository } from '../cultures/culture.repository.js';
import { nextAstCode } from '../../utils/identifiers.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import { CreateAstDto, CreateBatchAstDto, AstQueryDto } from './ast.dto.js';
import { AstRecord, UserRole } from '../../types/index.js';

export class AstService {
  private astRepo: AstRepository;
  private cultureRepo: CultureRepository;

  constructor() {
    this.astRepo = new AstRepository();
    this.cultureRepo = new CultureRepository();
  }

  async createAst(
    dto: CreateAstDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<AstRecord> {
    const culture = await this.cultureRepo.findById(dto.cultureId);
    if (!culture) {
      throw new Error(`Culture '${dto.cultureId}' not found`);
    }

    const astCode = await nextAstCode();

    const record = await this.astRepo.create({
      astCode,
      cultureId: dto.cultureId,
      organismIdentified: dto.organismIdentified,
      antibioticName: dto.antibioticName,
      method: dto.method,
      zoneDiameterMm: dto.zoneDiameterMm,
      micValueUgMl: dto.micValueUgMl,
      interpretation: dto.interpretation,
      referenceGuideline: dto.referenceGuideline || 'CLSI-M100-DEMO',
      technicianId: user.userId,
      notes: dto.notes,
    });

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'AST_RECORDED',
      entityType: 'ast',
      entityId: record.id,
      newState: {
        astCode: record.ast_code,
        cultureCode: culture.culture_code,
        organism: record.organism_identified,
        drug: record.antibiotic_name,
        interpretation: record.interpretation,
      },
      reason: `Antimicrobial susceptibility testing recorded for ${record.organism_identified}`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return record;
  }

  async createBatchAst(
    dto: CreateBatchAstDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<AstRecord[]> {
    const created: AstRecord[] = [];
    for (const r of dto.records) {
      const ast = await this.createAst(
        {
          cultureId: dto.cultureId,
          organismIdentified: dto.organismIdentified,
          antibioticName: r.antibioticName,
          method: r.method,
          zoneDiameterMm: r.zoneDiameterMm,
          micValueUgMl: r.micValueUgMl,
          interpretation: r.interpretation,
          referenceGuideline: r.referenceGuideline,
          notes: r.notes,
        },
        user,
        meta
      );
      created.push(ast);
    }
    return created;
  }

  async getAstById(id: string): Promise<AstRecord> {
    const record = await this.astRepo.findById(id);
    if (!record) throw new Error(`AST Record '${id}' not found`);
    return record;
  }

  async getAstByCulture(cultureId: string): Promise<AstRecord[]> {
    return this.astRepo.findByCultureId(cultureId);
  }

  async listAst(query: AstQueryDto): Promise<{ astRecords: AstRecord[]; total: number }> {
    return this.astRepo.findAll(query);
  }
}
