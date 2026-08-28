import { Router } from 'express';
import { AstController } from './ast.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateAstSchema, CreateBatchAstSchema, AstQuerySchema } from './ast.dto.js';

const router = Router();
const controller = new AstController();

router.use(authenticate);

router.get('/', validate({ query: AstQuerySchema }), controller.list);
router.get('/culture/:cultureId', controller.getByCulture);
router.get('/:id', controller.getById);

router.post(
  '/',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: CreateAstSchema }),
  controller.create
);

router.post(
  '/batch',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: CreateBatchAstSchema }),
  controller.createBatch
);

export default router;
