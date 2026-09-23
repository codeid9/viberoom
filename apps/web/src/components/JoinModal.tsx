import React, { useState } from 'react';
import { Button } from './Button';

interface JoinModalProps {
  onJoin: (name: string) => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (cleanName.length < 3) {
      setError('Display name must be at least 3 characters long.');
      return;
    }

    if (cleanName.length > 30) {
      setError('Display name cannot exceed 30 characters.');
      return;
    }

    setError(null);
    onJoin(cleanName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl flex flex-col gap-5">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-600/30 mb-3">
            V
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Join VibeRoom</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Choose a display name so your friends know who you are.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter your name (3-30 chars)"
            autoFocus
            maxLength={30}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <Button type="submit" size="md" className="w-full font-semibold" disabled={!name.trim()}>
            Join Room
          </Button>
        </form>
      </div>
    </div>
  );
};