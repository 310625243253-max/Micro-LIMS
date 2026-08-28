import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class AuditController {
  private auditService: AuditService;

  constructor() {
    this.auditService = new AuditService();
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { logs, total } = await this.auditService.listAuditLogs(req.query as any);
      sendSuccess(res, logs, 'Audit logs retrieved', 200, {
        total,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50),
      });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const log = await this.auditService.getAuditLogById(id);
      sendSuccess(res, log, 'Audit log retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };
}
