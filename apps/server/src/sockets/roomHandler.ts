import { Server, Socket } from 'socket.io';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

interface SendMessagePayload {
  roomId: string;
  senderName: string;
  content: string;
}

export const registerRoomHandlers = (io: Server, socket: Socket): void => {
  // 1. Handle join-room
  socket.on('join-room', async (data: { roomId: string }) => {
    try {
      const { roomId } = data || {};

      if (!roomId || typeof roomId !== 'string') {
        socket.emit('room-error', { message: 'A valid roomId is required.' });
        return;
      }

      const existingRoom = await Room.findOne({ roomId });
      if (!existingRoom) {
        socket.emit('room-error', { message: 'Room not found. Invalid room ID.' });
        return;
      }

      socket.join(roomId);

      socket.emit('room-joined', {
        roomId,
        message: `Successfully joined room ${roomId}`,
      });

      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    } catch (error) {
      console.error('Error in join-room handler:', error);
      socket.emit('room-error', { message: 'Internal server error while joining room.' });
    }
  });

  // 2. Handle leave-room
  socket.on('leave-room', (data: { roomId: string }) => {
    const { roomId } = data || {};

    if (roomId && typeof roomId === 'string') {
      socket.leave(roomId);
      socket.emit('room-left', { roomId });
      console.log(`Socket ${socket.id} left room: ${roomId}`);
    }
  });

  // 3. Handle send-message
  socket.on('send-message', async (data: SendMessagePayload) => {
    try {
      const { roomId, senderName, content } = data || {};

      // Input type validation
      if (
        typeof roomId !== 'string' ||
        typeof senderName !== 'string' ||
        typeof content !== 'string'
      ) {
        socket.emit('message-error', { message: 'Invalid message payload structure.' });
        return;
      }

      // Input sanitization / trimming
      const cleanSender = senderName.trim();
      const cleanContent = content.trim();

      if (cleanSender.length < 1 || cleanSender.length > 30) {
        socket.emit('message-error', {
          message: 'Sender name must be between 1 and 30 characters.',
        });
        return;
      }

      if (cleanContent.length < 1 || cleanContent.length > 1000) {
        socket.emit('message-error', {
          message: 'Message content must be between 1 and 1000 characters.',
        });
        return;
      }

      // Security check: Is this socket actually in this Socket.IO room?
      if (!socket.rooms.has(roomId)) {
        socket.emit('message-error', {
          message: 'Unauthorized: You must join the room before sending messages.',
        });
        return;
      }

      // Security check: Verify room still exists in DB and update activity
      const room = await Room.findOneAndUpdate(
        { roomId },
        { lastActivityAt: new Date() },
        { new: true }
      );

      if (!room) {
        socket.emit('message-error', { message: 'Room not found.' });
        return;
      }

      // Persist the message in MongoDB
      const savedMessage = await Message.create({
        roomId,
        senderName: cleanSender,
        content: cleanContent,
      });

      // Format payload for broadcast (stripping Mongoose internal __v)
      const broadcastPayload = {
        _id: savedMessage._id,
        roomId: savedMessage.roomId,
        senderName: savedMessage.senderName,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      };

      // Broadcast to everyone in the room (including the sender)
      io.to(roomId).emit('new-message', broadcastPayload);
    } catch (error) {
      console.error('Error handling send-message:', error);
      socket.emit('message-error', { message: 'Failed to process message.' });
    }
  });

  // 4. Handle disconnect / cleanup
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        console.log(`Socket ${socket.id} automatically left room: ${room} due to disconnect`);
      }
    }
  });
};