import { ObservationRepository } from './observation.repository.js';
import { CultureRepository } from '../cultures/culture.repository.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import { CreateObservationDto, ObservationQueryDto } from './observation.dto.js';
import { Observation, UserRole } from '../../types/index.js';

export class ObservationService {
  private observationRepo: ObservationRepository;
  private cultureRepo: CultureRepository;

  constructor() {
    this.observationRepo = new ObservationRepository();
    this.cultureRepo = new CultureRepository();
  }

  async createObservation(
    dto: CreateObservationDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Observation> {
    const culture = await this.cultureRepo.findById(dto.cultureId);
    if (!culture) {
      throw new Error(`Culture '${dto.cultureId}' not found`);
    }

    const observation = await this.observationRepo.create({
      cultureId: dto.cultureId,
      growthDetected: dto.growthDetected,
      growthStatus: dto.growthStatus,
      colonyMorphology: dto.colonyMorphology,
      pigmentation: dto.pigmentation,
      hemolysis: dto.hemolysis,
      colonyCountCfu: dto.colonyCountCfu,
      observedBy: user.userId,
      notes: dto.notes,
    });

    // Update culture status to OBSERVED
    await this.cultureRepo.updateStatus(culture.id, 'OBSERVED');

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'MORPHOLOGY_RECORDED',
      entityType: 'observation',
      entityId: observation.id,
      newState: {
        cultureCode: culture.culture_code,
        growthDetected: observation.growth_detected,
        growthStatus: observation.growth_status,
        morphology: observation.colony_morphology,
        hemolysis: observation.hemolysis,
      },
      reason: 'Macroscopic colonial morphology reading recorded',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return observation;
  }

  async getObservationById(id: string): Promise<Observation> {
    const obs = await this.observationRepo.findById(id);
    if (!obs) throw new Error(`Observation '${id}' not found`);
    return obs;
  }

  async getObservationsByCulture(cultureId: string): Promise<Observation[]> {
    return this.observationRepo.findByCultureId(cultureId);
  }

  async listObservations(query: ObservationQueryDto): Promise<{ observations: Observation[]; total: number }> {
    return this.observationRepo.findAll(query);
  }
}
