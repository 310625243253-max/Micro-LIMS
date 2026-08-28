import { CultureRepository } from './culture.repository.js';
import { SampleRepository } from '../samples/sample.repository.js';
import { MediaRepository } from '../media/media.repository.js';
import { nextCultureCode } from '../../utils/identifiers.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import { CreateCultureDto, UpdateCultureStatusDto, CultureQueryDto } from './culture.dto.js';
import { Culture, UserRole } from '../../types/index.js';

export class CultureService {
  private cultureRepo: CultureRepository;
  private sampleRepo: SampleRepository;
  private mediaRepo: MediaRepository;

  constructor() {
    this.cultureRepo = new CultureRepository();
    this.sampleRepo = new SampleRepository();
    this.mediaRepo = new MediaRepository();
  }

  async createCulture(
    dto: CreateCultureDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Culture> {
    const sample = await this.sampleRepo.findById(dto.sampleId);
    if (!sample) {
      throw new Error(`Sample '${dto.sampleId}' not found`);
    }

    if (sample.status === 'FINALIZED' || sample.status === 'CANCELLED') {
      throw new Error(`Cannot inoculate culture for sample with status '${sample.status}'`);
    }

    // Verify media lot if provided
    if (dto.mediaLotId) {
      const mediaLot = await this.mediaRepo.findById(dto.mediaLotId);
      if (!mediaLot) {
        throw new Error(`Media lot '${dto.mediaLotId}' not found`);
      }
      if (mediaLot.status !== 'ACTIVE') {
        throw new Error(`Media lot '${mediaLot.lot_number}' is marked as ${mediaLot.status} and cannot be used`);
      }
    }

    const cultureCode = await nextCultureCode();

    const culture = await this.cultureRepo.create({
      cultureCode,
      sampleId: dto.sampleId,
      mediaLotId: dto.mediaLotId,
      mediaType: dto.mediaType,
      inoculationMethod: dto.inoculationMethod,
      inoculatedBy: user.userId,
      status: 'INOCULATED',
      notes: dto.notes,
    });

    // Auto-advance sample status to IN_TESTING if it was ACCESSIONED
    if (sample.status === 'ACCESSIONED') {
      await this.sampleRepo.updateStatus(sample.id, 'IN_TESTING');
      await recordAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'SAMPLE_STATUS_CHANGED',
        entityType: 'sample',
        entityId: sample.id,
        previousState: { status: 'ACCESSIONED' },
        newState: { status: 'IN_TESTING' },
        reason: `Auto-advanced to IN_TESTING upon culture inoculation (${cultureCode})`,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });
    }

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'CULTURE_INOCULATED',
      entityType: 'culture',
      entityId: culture.id,
      newState: {
        cultureCode: culture.culture_code,
        sampleAccession: sample.accession_number,
        mediaType: culture.media_type,
        mediaLotNumber: culture.media_lot_number,
        method: culture.inoculation_method,
      },
      reason: `Culture inoculated on ${dto.mediaType}`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return culture;
  }

  async getCultureById(id: string): Promise<Culture> {
    const culture = await this.cultureRepo.findById(id);
    if (!culture) throw new Error(`Culture '${id}' not found`);
    return culture;
  }

  async listCultures(query: CultureQueryDto): Promise<{ cultures: Culture[]; total: number }> {
    return this.cultureRepo.findAll(query);
  }

  async updateCultureStatus(
    id: string,
    dto: UpdateCultureStatusDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Culture> {
    const current = await this.getCultureById(id);
    const updated = await this.cultureRepo.updateStatus(id, dto.status, dto.notes);
    if (!updated) throw new Error(`Failed to update culture status for '${id}'`);

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'CULTURE_STATUS_CHANGED',
      entityType: 'culture',
      entityId: id,
      previousState: { status: current.status },
      newState: { status: updated.status, notes: updated.notes },
      reason: `Culture status changed to ${dto.status}`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }
}
