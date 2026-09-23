import React, { useState } from 'react';
import { Button } from './Button';

interface RoomHeaderProps {
  roomId: string;
  onlineCount: number;
  isConnected: boolean;
  isJoined: boolean;
  onLeave: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  roomId,
  onlineCount,
  isConnected,
  isJoined,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-16 px-4 md:px-6 bg-neutral-900/70 border-b border-neutral-800/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/20">
          V
        </div>
        <span className="font-semibold text-neutral-100 tracking-tight text-sm md:text-base hidden sm:inline">
          VibeRoom
        </span>
        <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />
        <div className="flex items-center gap-2 bg-neutral-950/60 px-2.5 py-1 rounded-md border border-neutral-800">
          <span className="text-xs text-neutral-400">Room:</span>
          <span className="text-xs font-mono font-medium text-neutral-200">{roomId}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Real-time connection badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-colors ${
            isJoined
              ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400'
              : isConnected
              ? 'bg-amber-950/30 border-amber-900/40 text-amber-400'
              : 'bg-rose-950/30 border-rose-900/40 text-rose-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isJoined
                ? 'bg-emerald-500 animate-pulse'
                : isConnected
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
          <span>{isJoined ? `${onlineCount} online` : isConnected ? 'Joining...' : 'Connecting...'}</span>
        </div>

        <Button variant="secondary" size="sm" onClick={handleCopyLink}>
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>

        <Button variant="danger" size="sm" onClick={onLeave}>
          Leave
        </Button>
      </div>
    </header>
  );
};