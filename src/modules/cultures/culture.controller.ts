import { Request, Response, NextFunction } from 'express';
import { CultureService } from './culture.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class CultureController {
  private cultureService: CultureService;

  constructor() {
    this.cultureService = new CultureService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const culture = await this.cultureService.createCulture(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, culture, 'Culture inoculated successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { cultures, total } = await this.cultureService.listCultures(req.query as any);
      sendSuccess(res, cultures, 'Cultures retrieved', 200, {
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
      const culture = await this.cultureService.getCultureById(id);
      sendSuccess(res, culture, 'Culture retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const culture = await this.cultureService.updateCultureStatus(id, req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, culture, 'Culture status updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };
}
