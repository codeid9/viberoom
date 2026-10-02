import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
} from '../controllers/adminController.js';
import {
  getAdminRooms,
  getAdminRoomDetails,
  clearRoomMessages,
  deleteRoom,
} from '../controllers/adminRoomController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { adminApiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Apply auth + admin verification + admin rate limit
router.use(requireAuth);
router.use(requireAdmin);
router.use(adminApiLimiter);

// --- User Management Endpoints ---
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:userId/status', updateUserStatus);
router.post('/users/:userId/reset-password', resetUserPassword);
router.delete('/users/:userId', deleteUser);

// --- Room Management & Cleanup Endpoints ---
router.get('/rooms', getAdminRooms);
router.get('/rooms/:roomId', getAdminRoomDetails);
router.delete('/rooms/:roomId/messages', clearRoomMessages);
router.delete('/rooms/:roomId', deleteRoom);

export default router;