import React, { useState } from 'react';
import { X, Play, Link2, Sparkles, Loader2, Check } from 'lucide-react';
import { videoService } from '../services/videoService';
import { usePlayer } from '../context/PlayerContext';

const SAMPLE_LINKS = [
  { label: 'Never Gonna Give You Up', id: 'dQw4w9WgXcQ' },
  { label: 'GTA 6 Official 4K', id: 'dQw4w9WgXcQ' },
  { label: 'Veritasium Radiation', id: '3JZ_D3ELwOQ' },
  { label: 'Fireship Web Dev 2026', id: 'L_LUpnjgPso' },
];

const DirectPlayModal = ({ onClose }) => {
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { playVideo } = usePlayer();

  const handleResolveAndPlay = async (valToUse) => {
    const raw = (valToUse || inputVal).trim();
    if (!raw) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const resolved = await videoService.resolveUrlOrId(raw);
      if (resolved) {
        playVideo(resolved);
        onClose();
      } else {
        setErrorMsg('Could not load this video. Please verify the URL or ID.');
      }
    } catch (err) {
      setErrorMsg('Failed to fetch video stream info.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-surface-dark-card border border-surface-dark-border p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-dutube-500" />
            <h3 className="text-sm font-bold text-zinc-100">Play Any YouTube Video</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
          Paste any YouTube URL or 11-character video ID below. DuTube will resolve the stream and cache the thumbnail automatically.
        </p>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-dark-elevated border border-surface-dark-border focus-within:border-dutube-500">
            <input
              type="text"
              autoFocus
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResolveAndPlay()}
              placeholder="e.g. https://youtu.be/dQw4w9WgXcQ"
              className="flex-1 bg-transparent px-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
            <button
              onClick={() => handleResolveAndPlay()}
              disabled={!inputVal.trim() || loading}
              className="px-3.5 py-1.5 rounded-lg bg-dutube-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-md shadow-dutube-500/20"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              <span>Play</span>
            </button>
          </div>

          {/* Quick Preset Samples */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
              Quick Test Samples
            </span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_LINKS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setInputVal(s.id);
                    handleResolveAndPlay(s.id);
                  }}
                  className="px-2.5 py-1 rounded-full bg-surface-dark-elevated hover:bg-surface-dark-border text-zinc-300 text-[11px] font-medium border border-white/5 active:scale-95 transition-all"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectPlayModal;
