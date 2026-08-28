import { SampleRepository } from './sample.repository.js';
import { nextSampleAccession } from '../../utils/identifiers.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import {
  CreateSampleDto,
  UpdateSampleDto,
  UpdateSampleStatusDto,
  SampleQueryDto,
} from './sample.dto.js';
import { Sample, SampleStatus, UserRole } from '../../types/index.js';

export class SampleService {
  private sampleRepo: SampleRepository;

  constructor() {
    this.sampleRepo = new SampleRepository();
  }

  async createSample(
    dto: CreateSampleDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Sample> {
    const accessionNumber = await nextSampleAccession();

    const sample = await this.sampleRepo.create({
      accessionNumber,
      patientSyntheticId: dto.patientSyntheticId,
      patientSyntheticName: dto.patientSyntheticName,
      sampleType: dto.sampleType,
      collectionSite: dto.collectionSite,
      priority: dto.priority || 'ROUTINE',
      status: 'ACCESSIONED',
      collectedAt: dto.collectedAt,
      accessionedBy: user.userId,
      clinicalNotes: dto.clinicalNotes,
    });

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'SAMPLE_ACCESSIONED',
      entityType: 'sample',
      entityId: sample.id,
      newState: {
        accessionNumber: sample.accession_number,
        sampleType: sample.sample_type,
        priority: sample.priority,
        status: sample.status,
      },
      reason: `Specimen intake and accession registration (${sample.accession_number})`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return sample;
  }

  async getSampleById(id: string): Promise<Sample> {
    const sample = await this.sampleRepo.findById(id);
    if (!sample) {
      throw new Error(`Sample with ID '${id}' not found`);
    }
    return sample;
  }

  async getSampleByAccession(accessionNumber: string): Promise<Sample> {
    const sample = await this.sampleRepo.findByAccessionNumber(accessionNumber);
    if (!sample) {
      throw new Error(`Sample with accession number '${accessionNumber}' not found`);
    }
    return sample;
  }

  async listSamples(query: SampleQueryDto): Promise<{ samples: Sample[]; total: number }> {
    return this.sampleRepo.findAll(query);
  }

  async updateSample(
    id: string,
    dto: UpdateSampleDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Sample> {
    const current = await this.getSampleById(id);

    if (current.status === 'FINALIZED') {
      throw new Error('Cannot modify a FINALIZED sample. Contact QA to issue an addendum.');
    }

    const updated = await this.sampleRepo.update(id, {
      patient_synthetic_id: dto.patientSyntheticId,
      patient_synthetic_name: dto.patientSyntheticName,
      sample_type: dto.sampleType,
      collection_site: dto.collectionSite,
      priority: dto.priority,
      clinical_notes: dto.clinicalNotes,
    });

    if (!updated) {
      throw new Error(`Failed to update sample '${id}'`);
    }

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'SAMPLE_UPDATED',
      entityType: 'sample',
      entityId: id,
      previousState: current,
      newState: updated,
      reason: `Sample clinical information update (${current.accession_number})`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  async updateSampleStatus(
    id: string,
    dto: UpdateSampleStatusDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<Sample> {
    const current = await this.getSampleById(id);
    this.validateStatusTransition(current.status, dto.status);

    const updated = await this.sampleRepo.updateStatus(id, dto.status);
    if (!updated) {
      throw new Error(`Failed to transition sample '${id}' status`);
    }

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'SAMPLE_STATUS_CHANGED',
      entityType: 'sample',
      entityId: id,
      previousState: { status: current.status },
      newState: { status: updated.status },
      reason: dto.reason || `Status transition from ${current.status} to ${dto.status} (${current.accession_number})`,
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return updated;
  }

  async getSampleLineage(id: string): Promise<any> {
    const lineage = await this.sampleRepo.getSampleLineage(id);
    if (!lineage) {
      throw new Error(`Sample with ID '${id}' not found`);
    }
    return lineage;
  }

  private validateStatusTransition(current: SampleStatus, target: SampleStatus): void {
    if (current === target) return;

    if (current === 'FINALIZED') {
      throw new Error('FINALIZED samples cannot undergo standard status transitions.');
    }

    const validTransitions: Record<SampleStatus, SampleStatus[]> = {
      REGISTERED: ['ACCESSIONED', 'CANCELLED'],
      ACCESSIONED: ['IN_TESTING', 'CANCELLED'],
      IN_TESTING: ['TESTING_COMPLETE', 'UNDER_REVIEW', 'CANCELLED'],
      TESTING_COMPLETE: ['UNDER_REVIEW', 'IN_TESTING', 'CANCELLED'],
      UNDER_REVIEW: ['APPROVED', 'IN_TESTING', 'CANCELLED'],
      APPROVED: ['FINALIZED', 'UNDER_REVIEW', 'CANCELLED'],
      FINALIZED: [],
      CANCELLED: ['REGISTERED'],
    };

    const allowed = validTransitions[current] || [];
    if (!allowed.includes(target)) {
      throw new Error(
        `Invalid sample status transition from '${current}' to '${target}'. Allowed: [${allowed.join(', ')}]`
      );
    }
  }
}
