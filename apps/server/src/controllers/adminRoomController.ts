import { Request, Response } from 'express';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

// GET /api/admin/rooms - List all rooms with message count and activity metadata
export const getAdminRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const rooms = await Room.find({})
      .populate('createdBy', 'username role')
      .sort({ lastActivityAt: -1 })
      .lean();

    // Map each room and count its messages directly in MongoDB
    const roomSummaries = await Promise.all(
      rooms.map(async (r: any) => {
        const messageCount = await Message.countDocuments({ roomId: r.roomId });
        return {
          roomId: r.roomId,
          createdAt: r.createdAt,
          lastActivityAt: r.lastActivityAt,
          creator: r.createdBy ? { username: r.createdBy.username, role: r.createdBy.role } : null,
          messageCount,
        };
      })
    );

    res.status(200).json({ rooms: roomSummaries });
  } catch (error) {
    console.error('Error fetching admin rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

// GET /api/admin/rooms/:roomId - Inspect single room metadata
export const getAdminRoomDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ error: 'Invalid room ID' });
      return;
    }

    const room: any = await Room.findOne({ roomId })
      .populate('createdBy', 'username role')
      .lean();

    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const messageCount = await Message.countDocuments({ roomId });

    res.status(200).json({
      room: {
        roomId: room.roomId,
        createdAt: room.createdAt,
        lastActivityAt: room.lastActivityAt,
        creator: room.createdBy ? { username: room.createdBy.username, role: room.createdBy.role } : null,
        messageCount,
      },
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
};

// DELETE /api/admin/rooms/:roomId/messages - Clear all messages in a room but keep the room
export const clearRoomMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ error: 'Invalid room ID' });
      return;
    }

    const roomExists = await Room.exists({ roomId });
    if (!roomExists) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // Delete messages matching roomId
    const result = await Message.deleteMany({ roomId });

    // Optionally notify active sockets in room that chat history was cleared
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('messages-cleared', {
        roomId,
        message: 'Chat history in this room was cleared by an administrator.',
      });
    }

    res.status(200).json({
      message: 'Room messages cleared successfully.',
      deletedCount: result.deletedCount || 0,
      roomId,
    });
  } catch (error) {
    console.error('Error clearing room messages:', error);
    res.status(500).json({ error: 'Failed to clear room messages' });
  }
};

// DELETE /api/admin/rooms/:roomId - Delete room and all its messages permanently
export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ error: 'Invalid room ID' });
      return;
    }

    const targetRoom = await Room.findOne({ roomId });
    if (!targetRoom) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    // 1. Notify connected sockets before tearing down the room
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('room-deleted', {
        roomId,
        message: 'This room was closed and deleted by an administrator.',
      });
      // Sockets leave the channel
      io.in(roomId).socketsLeave(roomId);
    }

    // 2. Delete messages first to prevent orphaned records if a failure occurs
    const messageResult = await Message.deleteMany({ roomId });

    // 3. Delete the room document
    await Room.deleteOne({ _id: targetRoom._id });

    res.status(200).json({
      message: `Room "${roomId}" and all associated data permanently deleted.`,
      deletedMessagesCount: messageResult.deletedCount || 0,
      roomId,
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
};