import { Router } from 'express';
import { createRoom, getRoomMessages } from '../controllers/roomController.js';

const router = Router();

// POST /api/rooms - Create a room
router.post('/', createRoom);

// GET /api/rooms/:roomId/messages - Fetch message history
router.get('/:roomId/messages', getRoomMessages);

export default router;