import { Router } from 'express';
import { IncubationController } from './incubation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  CreateIncubationSchema,
  UpdateIncubationStatusSchema,
  IncubationQuerySchema,
} from './incubation.dto.js';

const router = Router();
const controller = new IncubationController();

router.use(authenticate);

router.get('/', validate({ query: IncubationQuerySchema }), controller.list);
router.get('/:id', controller.getById);

router.post(
  '/',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: CreateIncubationSchema }),
  controller.create
);

router.patch(
  '/:id/status',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: UpdateIncubationStatusSchema }),
  controller.updateStatus
);

export default router;
