import { Router } from 'express';
import { login, getMe, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Rate-limited login (max 5 failed attempts per 15 min)
router.post('/login', loginLimiter, login);
router.post('/logout', logout);

// Protected session validation
router.get('/me', requireAuth, getMe);

export default router;