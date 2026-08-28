import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.middleware.js';
import { LoginSchema, RefreshTokenSchema } from './auth.dto.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new AuthController();

// Public auth routes
router.post('/login', validate({ body: LoginSchema }), controller.login);
router.post('/refresh', validate({ body: RefreshTokenSchema }), controller.refresh);

// Protected auth routes
router.get('/me', authenticate, controller.me);
router.post('/logout', authenticate, controller.logout);

export default router;
