import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';
import { sendError } from '../utils/response.js';

/**
 * RBAC Guard: Restricts route access to users with at least one matching role
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthenticated user', 401);
      return;
    }

    const userRoles = req.user.roles || [];

    // Admins always have access
    if (userRoles.includes('ADMIN')) {
      return next();
    }

    const hasPermission = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasPermission) {
      sendError(
        res,
        `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
}

/**
 * Require specific exact roles without automatic Admin override if needed
 */
export function requireExactRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Unauthenticated user', 401);
      return;
    }

    const userRoles = req.user.roles || [];
    const hasPermission = allowedRoles.some((r) => userRoles.includes(r));
    if (!hasPermission) {
      sendError(
        res,
        `Access denied. Requires exact role: [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
}
