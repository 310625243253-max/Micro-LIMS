import { Request, Response, NextFunction } from 'express';
import { ObservationService } from './observation.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class ObservationController {
  private observationService: ObservationService;

  constructor() {
    this.observationService = new ObservationService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const observation = await this.observationService.createObservation(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, observation, 'Morphology observation recorded', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { observations, total } = await this.observationService.listObservations(req.query as any);
      sendSuccess(res, observations, 'Observations retrieved', 200, {
        total,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 20),
      });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getByCulture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cultureId = String(req.params.cultureId);
      const observations = await this.observationService.getObservationsByCulture(cultureId);
      sendSuccess(res, observations, 'Culture observations retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const observation = await this.observationService.getObservationById(id);
      sendSuccess(res, observation, 'Observation retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };
}
