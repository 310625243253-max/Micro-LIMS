import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      await this.reviewService.submitForReview(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, { submitted: true }, 'Specimen results submitted for review successfully');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  performReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user!;
      const review = await this.reviewService.performReview(req.body, user, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, review, 'Electronic sign-off and review decision executed successfully', 201);
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getPending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pending = await this.reviewService.getPendingReviews();
      sendSuccess(res, pending, 'Pending review queue retrieved');
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };

  getBySample = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sampleId = String(req.params.sampleId);
      const reviews = await this.reviewService.getReviewsBySample(sampleId);
      sendSuccess(res, reviews, 'Sample reviews retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reviews, total } = await this.reviewService.listReviews(req.query as any);
      sendSuccess(res, reviews, 'Reviews retrieved', 200, {
        total,
        page: Number(req.query.page || 1),
        limit: Number(req.query.limit || 20),
      });
    } catch (err: any) {
      sendError(res, err.message, 400);
    }
  };
}
