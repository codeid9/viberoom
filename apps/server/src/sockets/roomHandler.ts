import { Server, Socket } from 'socket.io';
import Room from '../models/Room.js';
import Message from '../models/Message.js';

interface JoinRoomPayload {
  roomId: string;
  senderName: string;
}

interface SendMessagePayload {
  roomId: string;
  content: string;
}

// Helper to broadcast active socket count for a specific room
const broadcastRoomUserCount = (io: Server, roomId: string): void => {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const count = roomSockets ? roomSockets.size : 0;

  io.to(roomId).emit('room-users-updated', {
    roomId,
    count,
  });
};

export const registerRoomHandlers = (io: Server, socket: Socket): void => {
  // 1. Handle join-room with display name validation
  socket.on('join-room', async (data: JoinRoomPayload) => {
    try {
      const { roomId, senderName } = data || {};

      // Validate roomId
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('room-error', { message: 'A valid roomId is required.' });
        return;
      }

      // Backend name validation (Do not trust frontend alone)
      if (!senderName || typeof senderName !== 'string') {
        socket.emit('room-error', { message: 'A valid display name is required.' });
        return;
      }

      const cleanName = senderName.trim();
      if (cleanName.length < 3 || cleanName.length > 30) {
        socket.emit('room-error', {
          message: 'Display name must be between 3 and 30 characters.',
        });
        return;
      }

      // Verify room existence in MongoDB
      const existingRoom = await Room.findOne({ roomId });
      if (!existingRoom) {
        socket.emit('room-error', { message: 'Room not found. Invalid room ID.' });
        return;
      }

      // Store validated display name on the socket instance
      socket.data.senderName = cleanName;

      // Add socket to the room channel
      socket.join(roomId);

      // Acknowledge successful join
      socket.emit('room-joined', {
        roomId,
        senderName: cleanName,
        message: `Successfully joined room ${roomId}`,
      });

      console.log(`Socket ${socket.id} (${cleanName}) joined room: ${roomId}`);

      // Broadcast updated online count to all members in this room
      broadcastRoomUserCount(io, roomId);
    } catch (error) {
      console.error('Error in join-room handler:', error);
      socket.emit('room-error', { message: 'Internal server error while joining room.' });
    }
  });

  // 2. Handle explicit leave-room
  socket.on('leave-room', (data: { roomId: string }) => {
    const { roomId } = data || {};

    if (roomId && typeof roomId === 'string') {
      socket.leave(roomId);
      socket.emit('room-left', { roomId });
      console.log(`Socket ${socket.id} left room: ${roomId}`);
      broadcastRoomUserCount(io, roomId);
    }
  });

  // 3. Handle send-message using the socket's verified senderName
  socket.on('send-message', async (data: SendMessagePayload) => {
    try {
      const { roomId, content } = data || {};

      // Must be a joined user with an associated display name
      const verifiedSenderName = socket.data.senderName;
      if (!verifiedSenderName) {
        socket.emit('message-error', {
          message: 'Unauthorized: You must set a display name and join the room first.',
        });
        return;
      }

      if (typeof roomId !== 'string' || typeof content !== 'string') {
        socket.emit('message-error', { message: 'Invalid message payload.' });
        return;
      }

      const cleanContent = content.trim();
      if (cleanContent.length < 1 || cleanContent.length > 1000) {
        socket.emit('message-error', {
          message: 'Message content must be between 1 and 1000 characters.',
        });
        return;
      }

      // Security check: Ensure socket is actively joined to this room
      if (!socket.rooms.has(roomId)) {
        socket.emit('message-error', {
          message: 'Unauthorized: You are not in this room channel.',
        });
        return;
      }

      // Ensure room exists & update activity timestamp
      const room = await Room.findOneAndUpdate(
        { roomId },
        { lastActivityAt: new Date() },
        { new: true }
      );

      if (!room) {
        socket.emit('message-error', { message: 'Room not found.' });
        return;
      }

      // Persist the message with the socket's server-stored display name
      const savedMessage = await Message.create({
        roomId,
        senderName: verifiedSenderName,
        content: cleanContent,
      });

      const broadcastPayload = {
        _id: savedMessage._id,
        roomId: savedMessage.roomId,
        senderName: savedMessage.senderName,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      };

      io.to(roomId).emit('new-message', broadcastPayload);
    } catch (error) {
      console.error('Error handling send-message:', error);
      socket.emit('message-error', { message: 'Failed to process message.' });
    }
  });

  // 4. Handle disconnect and automatically notify rooms the socket left
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        console.log(`Socket ${socket.id} leaving room: ${room} on disconnect`);
        // Calculate new count assuming this socket has left
        const roomSockets = io.sockets.adapter.rooms.get(room);
        const count = roomSockets ? Math.max(0, roomSockets.size - 1) : 0;
        io.to(room).emit('room-users-updated', {
          roomId: room,
          count,
        });
      }
    }
  });
};