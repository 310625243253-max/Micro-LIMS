import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const metrics = await this.dashboardService.getMetrics();
      sendSuccess(res, metrics, 'Dashboard metrics retrieved');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };

  getActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt((req.query.limit as string) || '10', 10);
      const activity = await this.dashboardService.getRecentActivity(limit);
      sendSuccess(res, activity, 'Recent activity retrieved');
    } catch (err: any) {
      sendError(res, err.message, 500);
    }
  };
}
