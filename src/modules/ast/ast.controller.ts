import { Request, Response, NextFunction } from 'express';
import { AstService } from './ast.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class AstController {
  private astService: AstService;

  constructor() {
    this.astService = new AstService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const ast = await this.astService.createAst(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, ast, 'AST record created successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  createBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const records = await this.astService.createBatchAst(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, records, `Batch of ${records.length} AST records created`, 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { astRecords, total } = await this.astService.listAst(req.query as any);
      sendSuccess(res, astRecords, 'AST records retrieved', 200, {
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
      const records = await this.astService.getAstByCulture(cultureId);
      sendSuccess(res, records, 'Culture AST records retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const record = await this.astService.getAstById(id);
      sendSuccess(res, record, 'AST record retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };
}
