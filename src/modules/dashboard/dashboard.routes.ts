import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new DashboardController();

router.use(authenticate);

router.get('/metrics', controller.getMetrics);
router.get('/activity', controller.getActivity);

export default router;
