import { Request, Response } from 'express';
import crypto from 'crypto';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

const generateSecureRoomId = (): string => {
  return crypto.randomBytes(8).toString('base64url');
};

// POST /api/rooms - Create a new room
export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    // Identity is derived exclusively from the verified server-side session
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required to create a room.' });
      return;
    }

    const maxRetries = 3;
    let roomCreated = false;
    let newRoom;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const generatedId = generateSecureRoomId();

      try {
        // Disregard any client-supplied createdBy, role, or userId in req.body
        newRoom = await Room.create({
          roomId: generatedId,
          createdBy: req.user._id,
          lastActivityAt: new Date(),
        });
        roomCreated = true;
        break;
      } catch (err: any) {
        if (err.code === 11000) {
          continue;
        }
        throw err;
      }
    }

    if (!roomCreated || !newRoom) {
      res.status(500).json({ error: 'Failed to generate a unique room. Please try again.' });
      return;
    }

    res.status(201).json({
      roomId: newRoom.roomId,
      roomPath: `/room/${newRoom.roomId}`,
      createdAt: newRoom.createdAt,
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Internal server error while creating room' });
  }
};

// GET /api/rooms/:roomId - Verify room existence for authenticated user
export const getRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ error: 'A valid roomId parameter is required.' });
      return;
    }

    const room = await Room.findOne({ roomId }).select('roomId createdAt lastActivityAt').lean();

    if (!room) {
      res.status(404).json({ error: 'Room not found.' });
      return;
    }

    res.status(200).json({
      room: {
        roomId: room.roomId,
        createdAt: room.createdAt,
      },
    });
  } catch (error) {
    console.error('Error verifying room:', error);
    res.status(500).json({ error: 'Internal server error while verifying room.' });
  }
};

// GET /api/rooms/:roomId/messages - Fetch chronological message history
export const getRoomMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ error: 'A valid roomId parameter is required.' });
      return;
    }

    const roomExists = await Room.exists({ roomId });
    if (!roomExists) {
      res.status(404).json({ error: 'Room not found.' });
      return;
    }

    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id roomId senderName content createdAt')
      .lean();

    res.status(200).json({
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ error: 'Internal server error while fetching messages.' });
  }
};