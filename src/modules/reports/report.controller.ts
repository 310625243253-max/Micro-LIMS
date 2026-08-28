import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const sampleId = String(req.params.sampleId);
      const { report } = await this.reportService.generateReport(sampleId, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, report, 'Diagnostic report generated successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { buffer, filename } = await this.reportService.getReportPdfBuffer(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  preview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const { buffer, filename } = await this.reportService.getReportPdfBuffer(id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const { reports, total } = await this.reportService.listReports(limit, page);
      sendSuccess(res, reports, 'Reports retrieved', 200, { total, page, limit });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const report = await this.reportService.getReportById(id);
      sendSuccess(res, report, 'Report metadata retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const checksum = req.body.checksum || (req.query.checksum as string) || req.params.checksum;
      if (!checksum) {
        sendError(res, 'Checksum is required for verification', 400);
        return;
      }
      const result = await this.reportService.verifyChecksum(String(checksum));
      sendSuccess(res, result, result.valid ? 'Report signature verified successfully' : 'Invalid or unverified report checksum');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };
}
