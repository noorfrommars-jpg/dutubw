import React, { useEffect, useState } from 'react';
import Logo from './Logo';

const SplashScreen = ({ onFinished }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setFading(true);
    }, 1400);

    const timer2 = setTimeout(() => {
      onFinished();
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinished]);

  return (
    <div
      onClick={onFinished}
      className={`fixed inset-0 z-50 bg-[#0B0C0E] flex flex-col items-center justify-center cursor-pointer transition-opacity duration-400 select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient radial glow */}
      <div className="absolute w-96 h-96 rounded-full bg-dutube-500/15 blur-3xl pointer-events-none" />

      {/* Center animated Logo */}
      <div className="relative flex flex-col items-center animate-bounce-subtle">
        <Logo size="lg" showText={true} />
        <span className="text-xs font-semibold text-zinc-400 mt-3 tracking-widest uppercase">
          Stream Beyond Boundaries
        </span>
      </div>

      {/* Modern pulsing loader dots */}
      <div className="absolute bottom-16 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-dutube-500 animate-ping" />
        <div className="w-1.5 h-1.5 rounded-full bg-dutube-500/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-dutube-500/30" />
      </div>
    </div>
  );
};

export default SplashScreen;
