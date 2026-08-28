import { Router } from 'express';
import { ObservationController } from './observation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateObservationSchema, ObservationQuerySchema } from './observation.dto.js';

const router = Router();
const controller = new ObservationController();

router.use(authenticate);

router.get('/', validate({ query: ObservationQuerySchema }), controller.list);
router.get('/culture/:cultureId', controller.getByCulture);
router.get('/:id', controller.getById);

router.post(
  '/',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: CreateObservationSchema }),
  controller.create
);

export default router;
