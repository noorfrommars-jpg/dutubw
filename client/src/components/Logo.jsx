import React from 'react';

const Logo = ({ size = 'md', showText = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none cursor-pointer ${className}`}>
      {/* DuTube Emblem */}
      <div className={`relative ${iconSizes[size]} rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#FF1E41] via-[#FF2A4D] to-[#FF6B4A] shadow-lg shadow-dutube-500/25 group transition-transform active:scale-95`}>
        {/* Subtle inner gloss */}
        <div className="absolute inset-0 rounded-xl bg-white/10 opacity-60 pointer-events-none" />
        
        {/* Play Icon Glyph */}
        <svg
          viewBox="0 0 24 24"
          className="w-1/2 h-1/2 fill-white drop-shadow-sm ml-0.5"
        >
          <path d="M5.25 4.5l14.25 7.5-14.25 7.5V4.5z" />
        </svg>

        {/* Pulse ring on hover */}
        <span className="absolute -inset-0.5 rounded-xl bg-dutube-500 opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <span className={`${textSizes[size]} font-extrabold tracking-tight text-white flex items-center`}>
          Du<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2A4D] to-[#FF6B4A]">Tube</span>
          <span className="ml-1 text-[9px] uppercase px-1.5 py-0.5 rounded bg-surface-dark-elevated text-zinc-400 font-semibold tracking-wider border border-white/5">
            PRO
          </span>
        </span>
      )}
    </div>
  );
};

export default Logo;
