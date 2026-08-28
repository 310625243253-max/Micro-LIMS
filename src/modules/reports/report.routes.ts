import { Router } from 'express';
import { ReportController } from './report.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';

const router = Router();
const controller = new ReportController();

// Checksum verification can be public / authenticated
router.post('/verify', controller.verify);
router.get('/verify', controller.verify);

// Protected report endpoints
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.get('/:id/download', controller.download);
router.get('/:id/preview', controller.preview);

router.post(
  '/generate/:sampleId',
  requireRole('ADMIN', 'MICROBIOLOGIST', 'REVIEWER'),
  controller.generate
);

export default router;
