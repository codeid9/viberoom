import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomHeader } from '../components/RoomHeader';
import { VideoPanel } from '../components/VideoPanel';
import { ChatPanel } from '../components/ChatPanel';
import { Button } from '../components/Button';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { useAuth } from '../context/AuthContext';
import { verifyRoomExists } from '../services/roomService';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isRoomValid, setIsRoomValid] = useState<boolean | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  // 1. Verify room exists via authenticated HTTP before socket connection
  useEffect(() => {
    if (!roomId) {
      setRoomError('Invalid Room ID.');
      setIsRoomValid(false);
      return;
    }

    let isMounted = true;
    verifyRoomExists(roomId)
      .then((exists) => {
        if (!isMounted) return;
        if (!exists) {
          setRoomError('Room not found or no longer active.');
          setIsRoomValid(false);
        } else {
          setIsRoomValid(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setRoomError('Unable to connect to room.');
        setIsRoomValid(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  // 2. Connect socket only if room is validated
  const { socket, isConnected, isJoined, onlineCount, error: socketError } = useRoomSocket(
    isRoomValid ? roomId : undefined,
    user?.username
  );

  const handleLeaveRoom = () => {
    navigate('/');
  };

  if (isRoomValid === false) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-neutral-950 p-4">
        <div className="max-w-sm w-full bg-neutral-900 border border-neutral-800 p-6 rounded-2xl text-center flex flex-col gap-4 shadow-2xl">
          <h2 className="text-lg font-bold text-rose-300">Room Inaccessible</h2>
          <p className="text-xs text-neutral-400">{roomError || 'This room does not exist.'}</p>
          <Button onClick={handleLeaveRoom}>Return Home</Button>
        </div>
      </div>
    );
  }

  const activeError = roomError || socketError;

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 overflow-hidden relative">
      <RoomHeader
        roomId={roomId || 'unknown'}
        onlineCount={onlineCount}
        isConnected={isConnected}
        isJoined={isJoined}
        onLeave={handleLeaveRoom}
      />

      {activeError && (
        <div className="bg-rose-950/70 border-b border-rose-800/60 px-4 py-2 text-rose-300 text-xs flex items-center justify-between z-20">
          <span>{activeError}</span>
          <Button variant="ghost" size="sm" onClick={handleLeaveRoom} className="text-rose-200">
            Return Home
          </Button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        <VideoPanel roomId={roomId || ''} socket={socket} isJoined={isJoined} />
        <ChatPanel
          roomId={roomId || ''}
          socket={socket}
          isJoined={isJoined}
          senderName={user?.username || 'Authenticated User'}
        />
      </div>
    </div>
  );
};