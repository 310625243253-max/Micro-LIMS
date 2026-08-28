import { ReportRepository } from './report.repository.js';
import { SampleRepository } from '../samples/sample.repository.js';
import { ReviewRepository } from '../reviews/review.repository.js';
import { nextReportCode } from '../../utils/identifiers.js';
import { generateMicrobiologyReportPdf } from './report.generator.js';
import { recordAuditLog } from '../../middleware/audit.middleware.js';
import { ReportRecord, UserRole } from '../../types/index.js';

// In-memory PDF buffer cache for instantaneous download streaming
const pdfBufferCache = new Map<string, Buffer>();

export class ReportService {
  private reportRepo: ReportRepository;
  private sampleRepo: SampleRepository;
  private reviewRepo: ReviewRepository;

  constructor() {
    this.reportRepo = new ReportRepository();
    this.sampleRepo = new SampleRepository();
    this.reviewRepo = new ReviewRepository();
  }

  async generateReport(
    sampleId: string,
    user: { userId: string; email: string; roles: UserRole[] },
    meta?: { ip?: string; userAgent?: string }
  ): Promise<{ report: ReportRecord; pdfBuffer: Buffer }> {
    const lineage = await this.sampleRepo.getSampleLineage(sampleId);
    if (!lineage || !lineage.sample) {
      throw new Error(`Sample '${sampleId}' not found`);
    }

    const reportCode = await nextReportCode();
    const generatedAt = new Date();

    // Fetch latest finalized review if available
    const reviews = await this.reviewRepo.findBySampleId(sampleId);
    const approvedReview = reviews.find((r) => r.decision === 'APPROVE') || reviews[0];

    // Generate PDF document
    const { buffer, checksumSha256, filename } = await generateMicrobiologyReportPdf({
      reportCode,
      generatedAt,
      sample: lineage.sample,
      cultures: lineage.cultures || [],
      incubations: lineage.incubations || [],
      observations: lineage.observations || [],
      tests: lineage.tests || [],
      astRecords: lineage.astRecords || [],
      review: approvedReview,
    });

    const report = await this.reportRepo.create({
      reportCode,
      sampleId,
      generatedBy: user.userId,
      reportType: 'FINAL_MICROBIOLOGY_REPORT',
      pdfFilename: filename,
      checksumSha256,
    });

    pdfBufferCache.set(report.id, buffer);
    pdfBufferCache.set(report.report_code, buffer);

    await recordAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: 'REPORT_GENERATED',
      entityType: 'report',
      entityId: report.id,
      newState: {
        reportCode: report.report_code,
        sampleAccession: lineage.sample.accession_number,
        checksum: checksumSha256,
        pdfFilename: filename,
      },
      reason: 'Official PDF Diagnostic Report synthesized and signed',
      ipAddress: meta?.ip,
      userAgent: meta?.userAgent,
    });

    return { report, pdfBuffer: buffer };
  }

  async getReportPdfBuffer(reportId: string): Promise<{ buffer: Buffer; filename: string }> {
    const report = await this.reportRepo.findById(reportId);
    if (!report) {
      throw new Error(`Report '${reportId}' not found`);
    }

    let buffer = pdfBufferCache.get(report.id);
    if (!buffer) {
      // Re-generate if buffer not in memory cache
      const lineage = await this.sampleRepo.getSampleLineage(report.sample_id);
      const reviews = await this.reviewRepo.findBySampleId(report.sample_id);
      const approvedReview = reviews.find((r) => r.decision === 'APPROVE') || reviews[0];

      const gen = await generateMicrobiologyReportPdf({
        reportCode: report.report_code,
        generatedAt: report.generated_at,
        sample: lineage.sample,
        cultures: lineage.cultures || [],
        incubations: lineage.incubations || [],
        observations: lineage.observations || [],
        tests: lineage.tests || [],
        astRecords: lineage.astRecords || [],
        review: approvedReview,
      });

      buffer = gen.buffer;
      pdfBufferCache.set(report.id, buffer);
    }

    return { buffer, filename: report.pdf_filename };
  }

  async getReportById(id: string): Promise<ReportRecord> {
    const report = await this.reportRepo.findById(id);
    if (!report) throw new Error(`Report '${id}' not found`);
    return report;
  }

  async listReports(limit = 50, page = 1): Promise<{ reports: ReportRecord[]; total: number }> {
    const offset = (page - 1) * limit;
    return this.reportRepo.findAll(limit, offset);
  }

  async verifyChecksum(checksum: string): Promise<{ valid: boolean; report?: ReportRecord }> {
    const report = await this.reportRepo.findByChecksum(checksum);
    if (!report) {
      return { valid: false };
    }
    return { valid: true, report };
  }
}
