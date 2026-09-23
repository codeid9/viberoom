import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { createRoom } from '../services/roomService';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateRoom = async () => {
    if (isCreating) return; // Guard against accidental repeated clicks

    setIsCreating(true);
    setErrorMessage(null);

    try {
      const data = await createRoom();
      // Navigate dynamically using the backend-generated roomId
      navigate(`/room/${data.roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to reach the server. Please check your connection and try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = joinRoomId.trim();
    if (!trimmedInput) return;

    // Handle full URLs pasted in or raw room IDs
    const extractedRoomId = trimmedInput.includes('/room/')
      ? trimmedInput.split('/room/')[1]?.split(/[?#]/)[0]
      : trimmedInput;

    if (extractedRoomId) {
      navigate(`/room/${extractedRoomId}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md flex flex-col items-center text-center z-10">
        {/* Branding icon */}
        <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-indigo-600/25 mb-6">
          V
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
          VibeRoom
        </h1>
        <p className="text-neutral-400 text-sm md:text-base mb-8">
          Your private space to hang out.
        </p>

        {/* Card container */}
        <div className="w-full bg-neutral-900/60 border border-neutral-800/80 p-6 rounded-2xl backdrop-blur-sm shadow-xl flex flex-col gap-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs text-left animate-fadeIn">
              {errorMessage}
            </div>
          )}

          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Creating Room...
              </span>
            ) : (
              'Create a Room'
            )}
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-xs text-neutral-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => {
                setJoinRoomId(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter room ID or paste link"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            <Button
              type="submit"
              variant="secondary"
              size="md"
              className="w-full"
              disabled={!joinRoomId.trim() || isCreating}
            >
              Join Room
            </Button>
          </form>
        </div>

        <p className="mt-8 text-xs text-neutral-600">
          No sign up required. Create a room and share the link.
        </p>
      </div>
    </main>
  );
};