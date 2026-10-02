import { Server, Socket } from 'socket.io';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import { socketLimiter } from '../utils/socketLimiter.js';

interface JoinRoomPayload {
  roomId: string;
}

interface SendMessagePayload {
  roomId: string;
  content: string;
}

interface SetYouTubeVideoPayload {
  roomId: string;
  videoId: string | null;
}

const roomVideos = new Map<string, string>();

const broadcastRoomUserCount = (io: Server, roomId: string): void => {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const count = roomSockets ? roomSockets.size : 0;

  io.to(roomId).emit('room-users-updated', {
    roomId,
    count,
  });

  if (count === 0) {
    roomVideos.delete(roomId);
  }
};

export const registerRoomHandlers = (io: Server, socket: Socket): void => {
  // 1. Join room (Rate-limited: max 6 join attempts per 10s per user)
  socket.on('join-room', async (data: JoinRoomPayload) => {
    try {
      const { roomId } = data || {};
      const authenticatedUser = socket.data.user;

      if (!authenticatedUser || !authenticatedUser.username) {
        socket.emit('room-error', { message: 'Unauthorized: Valid session required.' });
        return;
      }

      // Check join-room rate limit
      const canJoin = socketLimiter.checkLimit(`${authenticatedUser.userId}:join-room`, {
        windowMs: 10000,
        maxEvents: 6,
      });

      if (!canJoin) {
        socket.emit('room-error', {
          message: 'Joining rooms too quickly. Please wait a few seconds.',
        });
        return;
      }

      if (!roomId || typeof roomId !== 'string') {
        socket.emit('room-error', { message: 'A valid roomId is required.' });
        return;
      }

      const existingRoom = await Room.findOne({ roomId });
      if (!existingRoom) {
        socket.emit('room-error', { message: 'Room not found. Invalid room ID.' });
        return;
      }

      if (socket.data.activeRoomId && socket.data.activeRoomId !== roomId) {
        socket.leave(socket.data.activeRoomId);
        broadcastRoomUserCount(io, socket.data.activeRoomId);
      }

      socket.join(roomId);
      socket.data.activeRoomId = roomId;

      socket.emit('room-joined', {
        roomId,
        senderName: authenticatedUser.username,
        message: `Successfully joined room ${roomId}`,
      });

      broadcastRoomUserCount(io, roomId);

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

  // 2. Leave room
  socket.on('leave-room', (data: { roomId: string }) => {
    const { roomId } = data || {};

    if (roomId && typeof roomId === 'string') {
      socket.leave(roomId);
      if (socket.data.activeRoomId === roomId) {
        socket.data.activeRoomId = undefined;
      }
      socket.emit('room-left', { roomId });
      broadcastRoomUserCount(io, roomId);
    }
  });

  // 3. Set YouTube video (Rate-limited: max 3 video changes per 10s per user)
  socket.on('set-youtube-video', async (data: SetYouTubeVideoPayload) => { // 1. Yahan 'async' add kiya
    try {
      const { roomId, videoId } = data || {};
      const authenticatedUser = socket.data.user;

      if (!authenticatedUser) {
        socket.emit('room-error', { message: 'Unauthorized session.' });
        return;
      }

      // Check YouTube change rate limit
      const canChangeVideo = socketLimiter.checkLimit(
        `${authenticatedUser.userId}:set-youtube-video`,
        {
          windowMs: 10000,
          maxEvents: 3,
        }
      );

      if (!canChangeVideo) {
        socket.emit('room-error', {
          message: 'Video changes are too frequent. Please wait a few seconds.',
        });
        return;
      }

      if (!roomId || typeof roomId !== 'string') {
        socket.emit('room-error', { message: 'A valid roomId is required.' });
        return;
      }

      if (!socket.rooms.has(roomId) || socket.data.activeRoomId !== roomId) {
        socket.emit('room-error', {
          message: 'Unauthorized: You must join the room before changing the video.',
        });
        return;
      }

      if (videoId !== null && (typeof videoId !== 'string' || videoId.trim().length === 0)) {
        socket.emit('room-error', { message: 'Invalid video ID.' });
        return;
      }

      const cleanVideoId = videoId ? videoId.trim() : null;

      if (cleanVideoId) {
        roomVideos.set(roomId, cleanVideoId);
      } else {
        roomVideos.delete(roomId);
      }

      // 2. Yahan ye database update add kiya taaki room active rahe aur auto-delete na ho
      await Room.findOneAndUpdate(
        { roomId },
        { lastActivityAt: new Date() },
        { new: true }
      );

      io.to(roomId).emit('youtube-video-changed', {
        roomId,
        videoId: cleanVideoId,
      });
    } catch (error) {
      console.error('Error in set-youtube-video handler:', error);
      socket.emit('room-error', { message: 'Failed to update video.' });
    }
  });

  // 4. Send message (Rate-limited: max 5 messages per 5s per authenticated user)
  socket.on('send-message', async (data: SendMessagePayload) => {
    try {
      const { roomId, content } = data || {};
      const authenticatedUser = socket.data.user;

      if (!authenticatedUser || !authenticatedUser.username) {
        socket.emit('message-error', {
          message: 'Unauthorized: Session missing. Please log in.',
        });
        return;
      }

      // Check message rate limit
      const canSendMessage = socketLimiter.checkLimit(
        `${authenticatedUser.userId}:send-message`,
        {
          windowMs: 5000,
          maxEvents: 5,
        }
      );

      if (!canSendMessage) {
        // Discard without database write or room broadcast
        socket.emit('message-error', {
          message: 'You are sending messages too quickly. Please slow down.',
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

      if (!socket.rooms.has(roomId) || socket.data.activeRoomId !== roomId) {
        socket.emit('message-error', {
          message: 'Unauthorized: You are not an active member of this room.',
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

      // Save only validated, unthrottled messages to MongoDB
      const savedMessage = await Message.create({
        roomId,
        senderName: authenticatedUser.username,
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

  // 5. Disconnect
  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
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