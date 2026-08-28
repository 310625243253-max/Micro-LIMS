import { Request, Response, NextFunction } from 'express';
import { IncubationService } from './incubation.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class IncubationController {
  private incubationService: IncubationService;

  constructor() {
    this.incubationService = new IncubationService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const incubation = await this.incubationService.createIncubation(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, incubation, 'Incubation cycle scheduled and running', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { incubations, total } = await this.incubationService.listIncubations(req.query as any);
      sendSuccess(res, incubations, 'Incubations retrieved', 200, {
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
      const incubation = await this.incubationService.getIncubationById(id);
      sendSuccess(res, incubation, 'Incubation retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const incubation = await this.incubationService.updateIncubationStatus(
        id,
        req.body,
        user,
        {
          ip: req.ip || (req.headers['x-forwarded-for'] as string),
          userAgent: req.headers['user-agent'],
        }
      );
      sendSuccess(res, incubation, 'Incubation status updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };
}
