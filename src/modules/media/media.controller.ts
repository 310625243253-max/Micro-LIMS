import { Request, Response, NextFunction } from 'express';
import { MediaService } from './media.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class MediaController {
  private mediaService: MediaService;

  constructor() {
    this.mediaService = new MediaService();
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mediaLots, total } = await this.mediaService.listMediaLots(req.query as any);
      sendSuccess(res, mediaLots, 'Media lots retrieved', 200, {
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
      const lot = await this.mediaService.getMediaLotById(id);
      sendSuccess(res, lot, 'Media lot retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const lot = await this.mediaService.createMediaLot(req.body, user);
      sendSuccess(res, lot, 'Media lot created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const lot = await this.mediaService.updateMediaLotStatus(id, req.body.status, user);
      sendSuccess(res, lot, 'Media lot status updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };
}
