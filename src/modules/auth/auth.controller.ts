import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body, {
        ip: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'],
      });

      sendSuccess(res, result, 'Login successful');
    } catch (err: any) {
      sendError(res, err.message, 401);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.refreshToken(req.body);
      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (err: any) {
      sendError(res, err.message, 401);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'Unauthenticated', 401);
        return;
      }
      const user = await this.authService.getProfile(req.user.userId);
      sendSuccess(res, user, 'Profile retrieved');
    } catch (err: any) {
      sendError(res, err.message, 404);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    // Session token revocation endpoint
    sendSuccess(res, { loggedOut: true }, 'Logout successful');
  };
}
