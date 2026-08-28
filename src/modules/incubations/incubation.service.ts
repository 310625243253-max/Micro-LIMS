import { IncubationRepository } from './incubation.repository.js';
import { CultureRepository } from '../cultures/culture.repository.js';
import { nextIncubationCode } from '../../utils/identifiers.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import {
  CreateIncubationDto,
  UpdateIncubationStatusDto,
  IncubationQueryDto,
} from './incubation.dto.js';
import { Incubation, UserRole } from '../../types/index.js';

export class IncubationService {
  private incubationRepo: IncubationRepository;
  private cultureRepo: CultureRepository;

  constructor() {
    this.incubationRepo = new IncubationRepository();
    this.cultureRepo = new CultureRepository();
  }

  async createIncubation(
    dto: CreateIncubationDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Incubation> {
    const culture = await this.cultureRepo.findById(dto.cultureId);
    if (!culture) {
      throw new Error(`Culture '${dto.cultureId}' not found`);
    }

    if (culture.status === 'DISCARDED' || culture.status === 'CONTAMINATED') {
      throw new Error(`Cannot incubate culture with status '${culture.status}'`);
    }

    const incubationCode = await nextIncubationCode();
    const startedAt = new Date();
    const expectedCompletionAt = new Date(startedAt.getTime() + dto.durationHours * 60 * 60 * 1000);

    const incubation = await this.incubationRepo.create({
      incubationCode,
      cultureId: dto.cultureId,
      incubatorId: dto.incubatorId,
      temperatureCelsius: dto.temperatureCelsius,
      atmosphere: dto.atmosphere,
      durationHours: dto.durationHours,
      startedAt,
      expectedCompletionAt,
      status: 'RUNNING',
      operatorNotes: dto.operatorNotes,
    });

    // Update culture status to INCUBATING
    await this.cultureRepo.updateStatus(culture.id, 'INCUBATING');

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'INCUBATION_STARTED',
      entityType: 'incubation',
      entityId: incubation.id,
      newState: {
        incubationCode: incubation.incubation_code,
        cultureCode: culture.culture_code,
        incubatorId: incubation.incubator_id,
        temp: incubation.temperature_celsius,
        atmosphere: incubation.atmosphere,
        durationHours: incubation.duration_hours,
        dueAt: incubation.expected_completion_at,
      },
      reason: `Incubation chamber cycle initiated in ${dto.incubatorId}`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return incubation;
  }

  async getIncubationById(id: string): Promise<Incubation> {
    const inc = await this.incubationRepo.findById(id);
    if (!inc) throw new Error(`Incubation '${id}' not found`);
    return inc;
  }

  async listIncubations(query: IncubationQueryDto): Promise<{ incubations: Incubation[]; total: number }> {
    return this.incubationRepo.findAll(query);
  }

  async updateIncubationStatus(
    id: string,
    dto: UpdateIncubationStatusDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Incubation> {
    const current = await this.getIncubationById(id);

    let completedAt: Date | null = null;
    if (dto.status === 'COMPLETED') {
      completedAt = new Date();
    }

    const updated = await this.incubationRepo.updateStatus(
      id,
      dto.status,
      completedAt,
      dto.operatorNotes
    );

    if (!updated) throw new Error(`Failed to update incubation '${id}'`);

    // If completed or cancelled, update culture status if appropriate
    if (dto.status === 'COMPLETED') {
      await this.cultureRepo.updateStatus(current.culture_id, 'OBSERVED');
    }

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: dto.status === 'COMPLETED' ? 'INCUBATION_COMPLETED' : 'INCUBATION_STATUS_CHANGED',
      entityType: 'incubation',
      entityId: id,
      previousState: { status: current.status },
      newState: { status: updated.status, completedAt: updated.completed_at },
      reason: dto.operatorNotes || `Incubation status changed to ${dto.status}`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  async runScheduledSweep(): Promise<number> {
    const res = await this.incubationRepo.sweepOverdueIncubations();
    return res.updatedCount;
  }
}
