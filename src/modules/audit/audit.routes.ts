import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { AuditLogQuerySchema } from './audit.dto.js';

const router = Router();
const controller = new AuditController();

router.use(authenticate);

// Audit logs are accessible to all authenticated laboratory staff (21 CFR Part 11 transparency)
router.get(
  '/',
  requireRole('ADMIN', 'REVIEWER', 'VIEWER', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ query: AuditLogQuerySchema }),
  controller.list
);

router.get(
  '/:id',
  requireRole('ADMIN', 'REVIEWER', 'VIEWER', 'TECHNICIAN', 'MICROBIOLOGIST'),
  controller.getById
);

export default router;
