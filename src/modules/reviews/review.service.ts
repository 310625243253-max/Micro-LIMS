import { ReviewRepository } from './review.repository.js';
import { SampleRepository } from '../samples/sample.repository.js';
import { generateElectronicSignatureHash } from '../../utils/crypto.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import {
  SubmitReviewDto,
  PerformReviewDto,
  ReviewQueryDto,
} from './review.dto.js';
import { ReviewRecord, UserRole } from '../../types/index.js';

export class ReviewService {
  private reviewRepo: ReviewRepository;
  private sampleRepo: SampleRepository;

  constructor() {
    this.reviewRepo = new ReviewRepository();
    this.sampleRepo = new SampleRepository();
  }

  async submitForReview(
    dto: SubmitReviewDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    const sample = await this.sampleRepo.findById(dto.sampleId);
    if (!sample) {
      throw new Error(`Sample '${dto.sampleId}' not found`);
    }

    if (sample.status === 'FINALIZED') {
      throw new Error('Sample is already finalized');
    }

    await this.sampleRepo.updateStatus(sample.id, 'UNDER_REVIEW');

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'RESULT_SUBMITTED_FOR_REVIEW',
      entityType: 'review',
      entityId: sample.id,
      newState: { sampleAccession: sample.accession_number, status: 'UNDER_REVIEW' },
      reason: dto.comments || 'Workup complete. Submitted for Quality Assurance electronic sign-off.',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });
  }

  async performReview(
    dto: PerformReviewDto,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<ReviewRecord> {
    const sample = await this.sampleRepo.findById(dto.sampleId);
    if (!sample) {
      throw new Error(`Sample '${dto.sampleId}' not found`);
    }

    if (dto.decision === 'APPROVE') {
      if (sample.quarantined) {
        throw new Error('Cannot approve sample while marked under active QUARANTINE. Resolve incident first.');
      }

      const reviewedAt = new Date();
      const electronicSignatureHash = generateElectronicSignatureHash({
        sampleId: sample.id,
        reviewerId: user.userId,
        timestamp: reviewedAt,
        decision: dto.decision,
        signerName: dto.signerName,
      });

      const review = await this.reviewRepo.create({
        sampleId: sample.id,
        stage: 'FINALIZED',
        decision: 'APPROVE',
        comments: dto.comments,
        rejectionReason: null,
        amendmentReason: dto.amendmentReason,
        electronicSignatureHash,
        signerName: dto.signerName,
        signerTitle: dto.signerTitle,
        reviewerId: user.userId,
        reviewedAt,
      });

      await this.sampleRepo.updateStatus(sample.id, 'FINALIZED');

      await recordAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'ELECTRONIC_SIGN_OFF_COMPLETED',
        entityType: 'review',
        entityId: sample.id,
        newState: {
          sampleAccession: sample.accession_number,
          decision: 'APPROVE',
          signerName: dto.signerName,
          signerTitle: dto.signerTitle,
          signatureHash: electronicSignatureHash,
        },
        reason: dto.comments || 'Electronic signature verification completed and approved for clinical release.',
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      return review;
    } else if (dto.decision === 'REJECT') {
      const reviewedAt = new Date();
      const electronicSignatureHash = generateElectronicSignatureHash({
        sampleId: sample.id,
        reviewerId: user.userId,
        timestamp: reviewedAt,
        decision: 'REJECT',
        signerName: dto.signerName,
      });

      const review = await this.reviewRepo.create({
        sampleId: sample.id,
        stage: 'REJECTED',
        decision: 'REJECT',
        comments: dto.comments,
        rejectionReason: dto.rejectionReason,
        amendmentReason: null,
        electronicSignatureHash,
        signerName: dto.signerName,
        signerTitle: dto.signerTitle,
        reviewerId: user.userId,
        reviewedAt,
      });

      // Revert sample status back to IN_TESTING
      await this.sampleRepo.updateStatus(sample.id, 'IN_TESTING');

      await recordAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'REVIEW_REJECTED',
        entityType: 'review',
        entityId: sample.id,
        previousState: { status: sample.status },
        newState: { status: 'IN_TESTING', rejectionReason: dto.rejectionReason },
        reason: `Review rejected: ${dto.rejectionReason}`,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      return review;
    } else {
      // AMEND
      const reviewedAt = new Date();
      const electronicSignatureHash = generateElectronicSignatureHash({
        sampleId: sample.id,
        reviewerId: user.userId,
        timestamp: reviewedAt,
        decision: 'AMEND',
        signerName: dto.signerName,
      });

      const review = await this.reviewRepo.create({
        sampleId: sample.id,
        stage: 'APPROVED',
        decision: 'AMEND',
        comments: dto.comments,
        rejectionReason: null,
        amendmentReason: dto.amendmentReason,
        electronicSignatureHash,
        signerName: dto.signerName,
        signerTitle: dto.signerTitle,
        reviewerId: user.userId,
        reviewedAt,
      });

      await recordAuditLog({
        userId: user.userId,
        userEmail: user.email,
        action: 'REPORT_AMENDMENT_AUTHORIZED',
        entityType: 'review',
        entityId: sample.id,
        newState: { amendmentReason: dto.amendmentReason },
        reason: `Amendment recorded: ${dto.amendmentReason}`,
        ipAddress: meta?.ip,
        userAgent: meta?.userAgent,
      });

      return review;
    }
  }

  async getReviewsBySample(sampleId: string): Promise<ReviewRecord[]> {
    return this.reviewRepo.findBySampleId(sampleId);
  }

  async getPendingReviews(): Promise<any[]> {
    return this.reviewRepo.getPendingReviews();
  }

  async listReviews(query: ReviewQueryDto): Promise<{ reviews: ReviewRecord[]; total: number }> {
    return this.reviewRepo.findAll(query);
  }
}
