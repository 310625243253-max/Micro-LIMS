import { Router } from 'express';
import { SampleController } from './sample.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  CreateSampleSchema,
  UpdateSampleSchema,
  UpdateSampleStatusSchema,
  SampleQuerySchema,
} from './sample.dto.js';

const router = Router();
const controller = new SampleController();

// Apply authentication to all sample endpoints
router.use(authenticate);

// List samples
router.get(
  '/',
  validate({ query: SampleQuerySchema }),
  controller.list
);

// Accession / Register new sample (Technicians, Microbiologists, Admins)
router.post(
  '/',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: CreateSampleSchema }),
  controller.create
);

// Find sample by Accession Number
router.get(
  '/accession/:accessionNumber',
  controller.getByAccession
);

// Get complete specimen lineage and timeline graph
router.get(
  '/:id/lineage',
  controller.getLineage
);

// Get single sample
router.get(
  '/:id',
  controller.getById
);

// Update sample metadata
router.put(
  '/:id',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST'),
  validate({ body: UpdateSampleSchema }),
  controller.update
);

// Update sample status / workflow transition
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'TECHNICIAN', 'MICROBIOLOGIST', 'REVIEWER'),
  validate({ body: UpdateSampleStatusSchema }),
  controller.updateStatus
);

export default router;
