import { Request, Response, NextFunction } from 'express';
import { SampleService } from './sample.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class SampleController {
  private sampleService: SampleService;

  constructor() {
    this.sampleService = new SampleService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const sample = await this.sampleService.createSample(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, sample, 'Sample accessioned successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { samples, total } = await this.sampleService.listSamples(req.query as any);
      sendSuccess(res, samples, 'Samples retrieved', 200, {
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
      const sample = await this.sampleService.getSampleById(id);
      sendSuccess(res, sample, 'Sample retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  getByAccession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessionNumber = String(req.params.accessionNumber);
      const sample = await this.sampleService.getSampleByAccession(accessionNumber);
      sendSuccess(res, sample, 'Sample retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const sample = await this.sampleService.updateSample(id, req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, sample, 'Sample updated successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const id = String(req.params.id);
      const sample = await this.sampleService.updateSampleStatus(id, req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, sample, 'Sample status updated');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getLineage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const lineage = await this.sampleService.getSampleLineage(id);
      sendSuccess(res, lineage, 'Sample lineage and history retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };
}
