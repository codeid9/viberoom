import { Router } from 'express';
import { createRoom, getRoom, getRoomMessages } from '../controllers/roomController.js';
import { requireAuth } from '../middleware/auth.js';
import { roomCreationLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// All room routes require authentication
router.use(requireAuth);

// Rate-limited room creation (max 10 per hour per user/IP)
router.post('/', roomCreationLimiter, createRoom);

// GET /api/rooms/:roomId - Verify room existence
router.get('/:roomId', getRoom);

// GET /api/rooms/:roomId/messages - Fetch message history
router.get('/:roomId/messages', getRoomMessages);

export default router;