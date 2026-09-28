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

interface SetYouTubeVideoPayload {
  roomId: string;
  videoId: string | null;
}

// In-memory store for currently active YouTube video per room
// Key: roomId, Value: videoId
const roomVideos = new Map<string, string>();

// Helper to broadcast active socket count for a specific room
const broadcastRoomUserCount = (io: Server, roomId: string): void => {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const count = roomSockets ? roomSockets.size : 0;

  io.to(roomId).emit('room-users-updated', {
    roomId,
    count,
  });

  // If room is empty, clear in-memory video state
  if (count === 0) {
    roomVideos.delete(roomId);
  }
};

export const registerRoomHandlers = (io: Server, socket: Socket): void => {
  // 1. Handle join-room
  socket.on('join-room', async (data: JoinRoomPayload) => {
    try {
      const { roomId, senderName } = data || {};

      if (!roomId || typeof roomId !== 'string') {
        socket.emit('room-error', { message: 'A valid roomId is required.' });
        return;
      }

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

      const existingRoom = await Room.findOne({ roomId });
      if (!existingRoom) {
        socket.emit('room-error', { message: 'Room not found. Invalid room ID.' });
        return;
      }

      socket.data.senderName = cleanName;
      socket.join(roomId);

      socket.emit('room-joined', {
        roomId,
        senderName: cleanName,
        message: `Successfully joined room ${roomId}`,
      });

      console.log(`Socket ${socket.id} (${cleanName}) joined room: ${roomId}`);

      // Broadcast online count
      broadcastRoomUserCount(io, roomId);

      // Send the currently playing video to this newly joined socket (if one exists)
      const currentVideoId = roomVideos.get(roomId);
      if (currentVideoId) {
        socket.emit('youtube-video-changed', {
          roomId,
          videoId: currentVideoId,
        });
      }
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
      broadcastRoomUserCount(io, roomId);
    }
  });

  // 3. Handle set-youtube-video
  socket.on('set-youtube-video', (data: SetYouTubeVideoPayload) => {
    try {
      const { roomId, videoId } = data || {};

      if (!roomId || typeof roomId !== 'string') {
        socket.emit('room-error', { message: 'A valid roomId is required.' });
        return;
      }

      // Security check: Must be inside the room
      if (!socket.rooms.has(roomId)) {
        socket.emit('room-error', {
          message: 'Unauthorized: You must join the room before changing the video.',
        });
        return;
      }

      // Validate videoId (must be a string of reasonable length or null to clear)
      if (videoId !== null && (typeof videoId !== 'string' || videoId.trim().length === 0)) {
        socket.emit('room-error', { message: 'Invalid video ID.' });
        return;
      }

      const cleanVideoId = videoId ? videoId.trim() : null;

      // Update in-memory state
      if (cleanVideoId) {
        roomVideos.set(roomId, cleanVideoId);
      } else {
        roomVideos.delete(roomId);
      }

      // Broadcast new video state to EVERYONE in this room (including sender)
      io.to(roomId).emit('youtube-video-changed', {
        roomId,
        videoId: cleanVideoId,
      });

      console.log(`Room ${roomId} video changed to: ${cleanVideoId || 'cleared'}`);
    } catch (error) {
      console.error('Error in set-youtube-video handler:', error);
      socket.emit('room-error', { message: 'Failed to update video.' });
    }
  });

  // 4. Handle send-message
  socket.on('send-message', async (data: SendMessagePayload) => {
    try {
      const { roomId, content } = data || {};

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

      if (!socket.rooms.has(roomId)) {
        socket.emit('message-error', {
          message: 'Unauthorized: You are not in this room channel.',
        });
        return;
      }

      const room = await Room.findOneAndUpdate(
        { roomId },
        { lastActivityAt: new Date() },
        { new: true }
      );

      if (!room) {
        socket.emit('message-error', { message: 'Room not found.' });
        return;
      }

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

  // 5. Handle disconnect
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        console.log(`Socket ${socket.id} leaving room: ${room} on disconnect`);
        const roomSockets = io.sockets.adapter.rooms.get(room);
        const count = roomSockets ? Math.max(0, roomSockets.size - 1) : 0;
        io.to(room).emit('room-users-updated', {
          roomId: room,
          count,
        });

        if (count === 0) {
          roomVideos.delete(room);
        }
      }
    }
  });
};