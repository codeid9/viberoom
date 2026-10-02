import { Server as SocketIOServer } from 'socket.io';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Session from '../models/Session.js';
import { RETENTION_CONFIG } from '../config/retention.js';

interface CleanupSummary {
  deletedMessages: number;
  deletedRooms: number;
  deletedSessions: number;
  durationMs: number;
}

// 1. Delete messages older than retention window regardless of room state
export const cleanOldMessages = async (retentionDays = RETENTION_CONFIG.MESSAGE_RETENTION_DAYS): Promise<number> => {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const result = await Message.deleteMany({ createdAt: { $lt: cutoffDate } });
  return result.deletedCount || 0;
};

// 2. Delete inactive rooms and all of their orphaned messages
export const cleanInactiveRooms = async (
  retentionDays = RETENTION_CONFIG.ROOM_RETENTION_DAYS,
  io?: SocketIOServer
): Promise<number> => {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  // Find inactive rooms (project only roomId to keep memory minimal)
  const inactiveRooms = await Room.find({ lastActivityAt: { $lt: cutoffDate } })
    .select('roomId')
    .lean();

  if (inactiveRooms.length === 0) return 0;

  const roomIds = inactiveRooms.map((r) => r.roomId);

  // Notify any connected sockets if active before deletion
  if (io) {
    for (const roomId of roomIds) {
      io.to(roomId).emit('room-deleted', {
        roomId,
        message: 'This room has been closed due to inactivity.',
      });
      io.in(roomId).socketsLeave(roomId);
    }
  }

  // 1. Delete all messages associated with the inactive rooms
  await Message.deleteMany({ roomId: { $in: roomIds } });

  // 2. Delete the room documents
  const roomResult = await Room.deleteMany({ roomId: { $in: roomIds } });

  return roomResult.deletedCount || 0;
};

// 3. Fallback cleanup for expired sessions
export const cleanExpiredSessions = async (): Promise<number> => {
  const result = await Session.deleteMany({ expiresAt: { $lt: new Date() } });
  return result.deletedCount || 0;
};

// 4. Master cleanup runner with execution time tracking
export const runDatabaseCleanup = async (io?: SocketIOServer): Promise<CleanupSummary> => {
  const startTime = Date.now();
  console.log('[Cleanup] Starting database retention cleanup job...');

  try {
    const deletedMessages = await cleanOldMessages();
    const deletedRooms = await cleanInactiveRooms(undefined, io);
    const deletedSessions = await cleanExpiredSessions();

    const durationMs = Date.now() - startTime;
    console.log(
      `[Cleanup] Completed successfully in ${durationMs}ms: ${deletedMessages} old message(s), ${deletedRooms} inactive room(s), ${deletedSessions} expired session(s) removed.`
    );

    return {
      deletedMessages,
      deletedRooms,
      deletedSessions,
      durationMs,
    };
  } catch (error) {
    console.error('[Cleanup] Error during database cleanup execution:', error);
    return {
      deletedMessages: 0,
      deletedRooms: 0,
      deletedSessions: 0,
      durationMs: Date.now() - startTime,
    };
  }
};

// 5. Scheduled runner (runs non-blockingly after boot, then every 24 hours)
export const initScheduledCleanup = (io?: SocketIOServer): void => {
  const intervalMs = RETENTION_CONFIG.CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000;

  // Run initial pass after a 10-second boot grace period (avoids delaying startup)
  setTimeout(() => {
    runDatabaseCleanup(io).catch((err) => {
      console.error('[Cleanup] Initial startup cleanup failed gracefully:', err);
    });
  }, 10000).unref();

  // Schedule periodic cleanup cycle
  setInterval(() => {
    runDatabaseCleanup(io).catch((err) => {
      console.error('[Cleanup] Periodic cleanup failed gracefully:', err);
    });
  }, intervalMs).unref();

  console.log(
    `[Cleanup] Scheduled cleanup active: runs every ${RETENTION_CONFIG.CLEANUP_INTERVAL_HOURS}h (Message Retention: ${RETENTION_CONFIG.MESSAGE_RETENTION_DAYS}d, Room Retention: ${RETENTION_CONFIG.ROOM_RETENTION_DAYS}d).`
  );
};