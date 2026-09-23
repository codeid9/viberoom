import { Request, Response } from 'express';
import crypto from 'crypto';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

const generateSecureRoomId = (): string => {
  return crypto.randomBytes(8).toString('base64url');
};

export const createRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const maxRetries = 3;
    let roomCreated = false;
    let newRoom;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const generatedId = generateSecureRoomId();

      try {
        newRoom = await Room.create({
          roomId: generatedId,
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

// GET /api/rooms/:roomId/messages
export const getRoomMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ error: 'A valid roomId parameter is required.' });
      return;
    }

    // Verify room existence
    const roomExists = await Room.exists({ roomId });
    if (!roomExists) {
      res.status(404).json({ error: 'Room not found.' });
      return;
    }

    // Fetch the 50 most recent messages, ordered chronologically (oldest to newest)
    const messages = await Message.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('_id roomId senderName content createdAt')
      .lean();

    // Reverse array so the client gets them oldest to newest
    res.status(200).json({
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ error: 'Internal server error while fetching messages.' });
  }
};