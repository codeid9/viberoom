import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface UseRoomSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isJoined: boolean;
  onlineCount: number;
  error: string | null;
}

export const useRoomSocket = (roomId?: string, senderName?: string | null): UseRoomSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Do not initiate socket connection until both roomId and a valid senderName exist
    if (!roomId) {
      setError('Invalid or missing Room ID.');
      return;
    }

    if (!senderName || senderName.trim().length < 3) {
      return;
    }

    const socketInstance: Socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // Send both roomId and verified display name
      socketInstance.emit('join-room', {
        roomId,
        senderName: senderName.trim(),
      });
    });

    socketInstance.on('room-joined', () => {
      setIsJoined(true);
      setError(null);
    });

    socketInstance.on('room-users-updated', (data: { roomId: string; count: number }) => {
      if (data.roomId === roomId) {
        setOnlineCount(data.count);
      }
    });

    socketInstance.on('room-error', (err: { message?: string }) => {
      setIsJoined(false);
      setError(err?.message || 'Failed to join room.');
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
      setIsJoined(false);
      setError('Cannot reach the real-time server. Reconnecting...');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsJoined(false);
    });

    return () => {
      if (socketInstance.connected) {
        socketInstance.emit('leave-room', { roomId });
      }
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      setSocket(null);
      setIsJoined(false);
      setIsConnected(false);
    };
  }, [roomId, senderName]);

  return {
    socket,
    isConnected,
    isJoined,
    onlineCount,
    error,
  };
};