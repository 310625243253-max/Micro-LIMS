import { Request, Response, NextFunction } from 'express';
import { ContaminationService } from './contamination.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class ContaminationController {
  private contaminationService: ContaminationService;

  constructor() {
    this.contaminationService = new ContaminationService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const incident = await this.contaminationService.reportIncident(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, incident, 'Contamination incident reported and quarantine initiated', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { incidents, total } = await this.contaminationService.listIncidents(req.query as any);
      sendSuccess(res, incidents, 'Contamination incidents retrieved', 200, {
        total,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 20),
      });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const incident = await this.contaminationService.getIncidentById(id);
      sendSuccess(res, incident, 'Incident retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const incident = await this.contaminationService.updateIncident(
        id,
        req.body,
        user,
        {
          ip: req.ip || (req.headers['x-forwarded-for'] as string),
          userAgent: req.headers['user-agent'],
        }
      );
      sendSuccess(res, incident, 'Incident updated successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };
}
