import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  SubmitReviewSchema,
  PerformReviewSchema,
  ReviewQuerySchema,
} from './review.dto.js';

const router = Router();
const controller = new ReviewController();

router.use(authenticate);

// Get pending reviews queue (All lab personnel can inspect queue; only Reviewers/Admins can sign off)
router.get('/pending', requireRole('ADMIN', 'MICROBIOLOGIST', 'REVIEWER', 'TECHNICIAN'), controller.getPending);

// List reviews
router.get('/', validate({ query: ReviewQuerySchema }), controller.list);

// Get reviews for a specific sample
router.get('/sample/:sampleId', controller.getBySample);

// Submit results for review (Technicians, Microbiologists)
router.post(
  '/submit',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: SubmitReviewSchema }),
  controller.submit
);

// Perform electronic review and sign-off (Reviewers, Admins)
router.post(
  '/sign-off',
  requireRole('ADMIN', 'REVIEWER'),
  validate({ body: PerformReviewSchema }),
  controller.performReview
);

export default router;
