import { Router } from 'express';
import { TestController } from './test.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateTestSchema, TestQuerySchema } from './test.dto.js';

const router = Router();
const controller = new TestController();

router.use(authenticate);

router.get('/', validate({ query: TestQuerySchema }), controller.list);
router.get('/culture/:cultureId', controller.getByCulture);
router.get('/:id', controller.getById);

router.post(
  '/',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: CreateTestSchema }),
  controller.create
);

export default router;
