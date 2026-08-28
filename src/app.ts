import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

// Route Imports
import authRoutes from './modules/auth/auth.routes.js';
import sampleRoutes from './modules/samples/sample.routes.js';
import cultureRoutes from './modules/cultures/culture.routes.js';
import mediaRoutes from './modules/media/media.routes.js';
import incubationRoutes from './modules/incubations/incubation.routes.js';
import observationRoutes from './modules/observations/observation.routes.js';
import testRoutes from './modules/tests/test.routes.js';
import astRoutes from './modules/ast/ast.routes.js';
import contaminationRoutes from './modules/contamination/contamination.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || config.corsOrigins.includes(origin) || config.nodeEnv === 'development') {
          callback(null, true);
        } else {
          callback(new Error('CORS origin not allowed'));
        }
      },
      credentials: true,
    })
  );

  // Body Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General Rate Limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });
  app.use(generalLimiter);

  // Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      system: 'MicroLIMS Backend API',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
    });
  });

  // API v1 Routes
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/samples', sampleRoutes);
  apiV1.use('/cultures', cultureRoutes);
  apiV1.use('/media', mediaRoutes);
  apiV1.use('/incubations', incubationRoutes);
  apiV1.use('/observations', observationRoutes);
  apiV1.use('/tests', testRoutes);
  apiV1.use('/ast', astRoutes);
  apiV1.use('/contamination', contaminationRoutes);
  apiV1.use('/reviews', reviewRoutes);
  apiV1.use('/reports', reportRoutes);
  apiV1.use('/audit', auditRoutes);
  apiV1.use('/dashboard', dashboardRoutes);

  app.use('/api/v1', apiV1);

  // 404 & Error Middlewares
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
