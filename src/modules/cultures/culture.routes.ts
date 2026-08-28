import { Router } from 'express';
import { CultureController } from './culture.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateCultureSchema, UpdateCultureStatusSchema, CultureQuerySchema } from './culture.dto.js';

const router = Router();
const controller = new CultureController();

router.use(authenticate);

router.get('/', validate({ query: CultureQuerySchema }), controller.list);
router.get('/:id', controller.getById);

router.post(
  '/',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: CreateCultureSchema }),
  controller.create
);

router.patch(
  '/:id/status',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: UpdateCultureStatusSchema }),
  controller.updateStatus
);

export default router;
