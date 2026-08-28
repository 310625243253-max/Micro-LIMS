import { JwtAuthPayload } from './index.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtAuthPayload;
      auditContext?: {
        action?: string;
        entityType?: string;
        entityId?: string;
        previousState?: any;
        reason?: string;
      };
    }
  }
}

export {};
