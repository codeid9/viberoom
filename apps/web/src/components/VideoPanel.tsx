import React from 'react';

export const VideoPanel: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 p-4 md:p-6 overflow-hidden">
      <div className="relative w-full aspect-video bg-neutral-900/90 rounded-2xl border border-neutral-800/80 shadow-2xl flex flex-col items-center justify-center overflow-hidden group">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-linear-to-b from-indigo-500/5 to-transparent pointer-events-none" />

        {/* Video placeholder UI */}
        <div className="flex flex-col items-center gap-3 z-10 text-center px-4">
          <div className="w-16 h-12 rounded-xl bg-red-600/90 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform duration-200">
            <svg
              className="w-6 h-6 text-white translate-x-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            YouTube Player Area
          </span>
          <p className="text-neutral-500 text-xs max-w-sm">
            Shared video playback will synchronize here. Paste a link or select a video once connected.
          </p>
        </div>

        {/* Simulated bottom player bar */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-neutral-950/70 border-t border-neutral-800/60 px-4 flex items-center justify-between text-neutral-500 text-xs">
          <span>0:00 / 0:00</span>
          <span className="bg-neutral-800/80 px-2 py-0.5 rounded text-[10px] text-neutral-400">
            1080p
          </span>
        </div>
      </div>
    </div>
  );
};