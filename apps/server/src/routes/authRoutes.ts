import { Router } from 'express';
import { login, getMe, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Public auth actions
router.post('/login', login);
router.post('/logout', logout);

// Protected session validation
router.get('/me', requireAuth, getMe);

export default router;