import { Router } from 'express';
import { login, getMe, logout, refreshToken } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { authLimiter, apiLimiter } from '../middleware/rateLimit';

const router: Router = Router();

router.post('/login', authLimiter, login);
router.get('/me', authenticate, apiLimiter, getMe);
router.post('/logout', authenticate, apiLimiter, logout);
router.post('/refresh', authLimiter, refreshToken);

export default router;
