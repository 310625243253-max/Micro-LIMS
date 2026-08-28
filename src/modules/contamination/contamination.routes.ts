import { Router } from 'express';
import { ContaminationController } from './contamination.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  CreateContaminationSchema,
  UpdateContaminationSchema,
  ContaminationQuerySchema,
} from './contamination.dto.js';

const router = Router();
const controller = new ContaminationController();

router.use(authenticate);

router.get('/', validate({ query: ContaminationQuerySchema }), controller.list);
router.get('/:id', controller.getById);

router.post(
  '/',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST', 'REVIEWER'),
  validate({ body: CreateContaminationSchema }),
  controller.create
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'MICROBIOLOGIST', 'REVIEWER'),
  validate({ body: UpdateContaminationSchema }),
  controller.update
);

export default router;
