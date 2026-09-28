import React, { useState, useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { Button } from './Button';
import { extractYouTubeVideoId } from '../utils/youtube';

interface VideoPanelProps {
  roomId: string;
  socket: Socket | null;
  isJoined: boolean;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({ roomId, socket, isJoined }) => {
  const [urlInput, setUrlInput] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen for shared video updates from the server
  useEffect(() => {
    if (!socket) return;

    const handleVideoChanged = (data: { roomId: string; videoId: string | null }) => {
      if (data.roomId === roomId) {
        setCurrentVideoId(data.videoId);
      }
    };

    socket.on('youtube-video-changed', handleVideoChanged);

    return () => {
      socket.off('youtube-video-changed', handleVideoChanged);
    };
  }, [socket, roomId]);

  // Request to set the room video
  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const videoId = extractYouTubeVideoId(urlInput);

    if (!videoId) {
      setErrorMessage('Please enter a valid YouTube URL.');
      return;
    }

    if (!socket || !isJoined) {
      setErrorMessage('You must be connected to the room to load a video.');
      return;
    }

    socket.emit('set-youtube-video', {
      roomId,
      videoId,
    });

    setUrlInput('');
  };

  // Request to clear the room video
  const handleClearVideo = () => {
    if (!socket || !isJoined) return;

    socket.emit('set-youtube-video', {
      roomId,
      videoId: null,
    });
    setErrorMessage(null);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 p-4 md:p-6 overflow-hidden">
      {/* Video URL Controller Bar */}
      <div className="mb-4 flex flex-col gap-2">
        <form onSubmit={handleLoadVideo} className="flex gap-2 w-full">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={
              isJoined
                ? 'Paste YouTube URL for everyone (e.g., https://youtube.com/watch?v=...)'
                : 'Connecting to room...'
            }
            disabled={!isJoined}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          />
          <Button type="submit" size="sm" disabled={!urlInput.trim() || !isJoined}>
            Load Video
          </Button>
          {currentVideoId && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClearVideo}
              disabled={!isJoined}
              title="Remove current video for everyone"
            >
              Clear Video
            </Button>
          )}
        </form>

        {errorMessage && (
          <p className="text-rose-400 text-xs px-1 animate-fadeIn">{errorMessage}</p>
        )}
      </div>

      {/* Video Container Area */}
      <div className="relative w-full aspect-video bg-neutral-900/90 rounded-2xl border border-neutral-800/80 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
        {currentVideoId ? (
          <iframe
            key={currentVideoId}
            src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1`}
            title="YouTube Video Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0 rounded-2xl"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
            <div className="flex flex-col items-center gap-3 z-10 text-center px-4">
              <div className="w-16 h-12 rounded-xl bg-red-600/90 flex items-center justify-center shadow-lg shadow-red-600/20">
                <svg
                  className="w-6 h-6 text-white translate-x-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                YouTube Player
              </span>
              <p className="text-neutral-500 text-xs max-w-sm">
                Paste a YouTube link above to start watching together in this room.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};