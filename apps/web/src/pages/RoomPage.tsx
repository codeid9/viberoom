import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RoomHeader } from '../components/RoomHeader';
import { VideoPanel } from '../components/VideoPanel';
import { ChatPanel } from '../components/ChatPanel';
import { JoinModal } from '../components/JoinModal';
import { Button } from '../components/Button';
import { useRoomSocket } from '../hooks/useRoomSocket';

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // Retrieve existing session name if already entered in this tab session
  const [displayName, setDisplayName] = useState<string | null>(() => {
    return sessionStorage.getItem(`viberoom_name_${roomId}`) || null;
  });

  // Socket connects only after displayName is provided
  const { socket, isConnected, isJoined, onlineCount, error } = useRoomSocket(
    roomId,
    displayName
  );

  const handleJoinModalSubmit = (name: string) => {
    if (roomId) {
      sessionStorage.setItem(`viberoom_name_${roomId}`, name);
    }
    setDisplayName(name);
  };

  const handleLeaveRoom = () => {
    if (roomId) {
      sessionStorage.removeItem(`viberoom_name_${roomId}`);
    }
    navigate('/');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 overflow-hidden relative">
      {/* Display name entry gate */}
      {!displayName && <JoinModal onJoin={handleJoinModalSubmit} />}

      {/* Header bar with dynamic online count */}
      <RoomHeader
        roomId={roomId || 'unknown'}
        onlineCount={onlineCount}
        isConnected={isConnected}
        isJoined={isJoined}
        onLeave={handleLeaveRoom}
      />

      {error && (
        <div className="bg-rose-950/70 border-b border-rose-800/60 px-4 py-2 text-rose-300 text-xs flex items-center justify-between z-20">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={handleLeaveRoom} className="text-rose-200">
            Return Home
          </Button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        <VideoPanel />
        <ChatPanel
          roomId={roomId || ''}
          socket={socket}
          isJoined={isJoined}
          senderName={displayName || ''}
        />
      </div>
    </div>
  );
};