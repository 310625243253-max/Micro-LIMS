import { Router } from 'express';
import { MediaController } from './media.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { CreateMediaLotSchema, MediaLotQuerySchema } from './media.dto.js';

const router = Router();
const controller = new MediaController();

router.use(authenticate);

router.get('/', validate({ query: MediaLotQuerySchema }), controller.list);
router.get('/:id', controller.getById);
router.post('/', requireRole('ADMIN', 'TECHNICIAN'), validate({ body: CreateMediaLotSchema }), controller.create);
router.patch('/:id/status', requireRole('ADMIN', 'TECHNICIAN'), controller.updateStatus);

export default router;
