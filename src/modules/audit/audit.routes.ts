import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { AuditLogQuerySchema } from './audit.dto.js';

const router = Router();
const controller = new AuditController();

router.use(authenticate);

// Audit logs are accessible to ADMIN, REVIEWER, and VIEWER roles
router.get(
  '/',
  requireRole('ADMIN', 'REVIEWER', 'VIEWER'),
  validate({ query: AuditLogQuerySchema }),
  controller.list
);

router.get(
  '/:id',
  requireRole('ADMIN', 'REVIEWER', 'VIEWER'),
  controller.getById
);

export default router;
