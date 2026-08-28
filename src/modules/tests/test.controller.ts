import { Request, Response, NextFunction } from 'express';
import { TestService } from './test.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class TestController {
  private testService: TestService;

  constructor() {
    this.testService = new TestService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const test = await this.testService.createTest(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, test, 'Biochemical test recorded successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tests, total } = await this.testService.listTests(req.query as any);
      sendSuccess(res, tests, 'Tests retrieved', 200, {
        total,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 50),
      });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getByCulture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cultureId = String(req.params.cultureId);
      const tests = await this.testService.getTestsByCulture(cultureId);
      sendSuccess(res, tests, 'Culture tests retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const test = await this.testService.getTestById(id);
      sendSuccess(res, test, 'Test retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };
}
