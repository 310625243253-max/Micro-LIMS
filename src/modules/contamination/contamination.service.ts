import { ContaminationRepository } from './contamination.repository.js';
import { SampleRepository } from '../samples/sample.repository.js';
import { CultureRepository } from '../cultures/culture.repository.js';
import { nextIncidentCode } from '../../utils/identifiers.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import {
  CreateContaminationDto,
  UpdateContaminationDto,
  ContaminationQueryDto,
} from './contamination.dto.js';
import { ContaminationIncident, UserRole } from '../../types/index.js';

export class ContaminationService {
  private incidentRepo: ContaminationRepository;
  private sampleRepo: SampleRepository;
  private cultureRepo: CultureRepository;

  constructor() {
    this.incidentRepo = new ContaminationRepository();
    this.sampleRepo = new SampleRepository();
    this.cultureRepo = new CultureRepository();
  }

  async reportIncident(
    dto: CreateContaminationDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<ContaminationIncident> {
    const incidentCode = await nextIncidentCode();

    const incident = await this.incidentRepo.create({
      incidentCode,
      sampleId: dto.sampleId,
      cultureId: dto.cultureId,
      category: dto.category,
      description: dto.description,
      suspectedCause: dto.suspectedCause,
      correctiveAction: dto.correctiveAction,
      status: dto.status || 'SUSPECTED',
      reportedBy: user.userId,
    });

    // Automatically quarantine associated sample if status is SUSPECTED or QUARANTINED
    if (dto.sampleId && (incident.status === 'SUSPECTED' || incident.status === 'QUARANTINED')) {
      await this.sampleRepo.setQuarantine(dto.sampleId, true);
    }

    // Automatically mark culture as CONTAMINATED if cultureId specified and status is QUARANTINED
    if (dto.cultureId && incident.status === 'QUARANTINED') {
      await this.cultureRepo.updateStatus(dto.cultureId, 'CONTAMINATED', `Quarantined per incident ${incidentCode}`);
    }

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'CONTAMINATION_INCIDENT_CREATED',
      entityType: 'contamination_incident',
      entityId: incident.id,
      newState: {
        incidentCode: incident.incident_code,
        category: incident.category,
        status: incident.status,
        sampleId: incident.sample_id,
        cultureId: incident.culture_id,
      },
      reason: `Contamination incident reported: ${dto.category}`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return incident;
  }

  async getIncidentById(id: string): Promise<ContaminationIncident> {
    const incident = await this.incidentRepo.findById(id);
    if (!incident) throw new Error(`Contamination incident '${id}' not found`);
    return incident;
  }

  async listIncidents(query: ContaminationQueryDto): Promise<{ incidents: ContaminationIncident[]; total: number }> {
    return this.incidentRepo.findAll(query);
  }

  async updateIncident(
    id: string,
    dto: UpdateContaminationDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<ContaminationIncident> {
    const current = await this.getIncidentById(id);

    const isResolving = dto.status === 'RESOLVED' && current.status !== 'RESOLVED';
    const resolutionDate = isResolving ? new Date() : undefined;
    const resolvedBy = isResolving ? user.userId : undefined;

    const updated = await this.incidentRepo.update(id, {
      status: dto.status,
      suspectedCause: dto.suspectedCause,
      correctiveAction: dto.correctiveAction,
      resolvedBy,
      resolutionDate,
    });

    if (!updated) throw new Error(`Failed to update incident '${id}'`);

    // If resolved and linked to sample, check if any remaining active incidents exist
    if (isResolving && updated.sample_id) {
      const activeCount = await this.incidentRepo.countActiveIncidentsForSample(updated.sample_id);
      if (activeCount === 0) {
        await this.sampleRepo.setQuarantine(updated.sample_id, false);
      }
    }

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: isResolving ? 'CONTAMINATION_INCIDENT_RESOLVED' : 'CONTAMINATION_INCIDENT_UPDATED',
      entityType: 'contamination_incident',
      entityId: id,
      previousState: { status: current.status },
      newState: { status: updated.status, correctiveAction: updated.corrective_action },
      reason: `Incident ${updated.incident_code} updated to status ${updated.status}`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }
}
