import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

const ShareModal = ({ video, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!video) return null;

  const shareUrl = `${window.location.origin}/?v=${video.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Watch ${video.title} on DuTube`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-surface-dark-card border border-surface-dark-border p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-dutube-500" />
            <h3 className="text-sm font-bold text-zinc-100">Share Video</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video preview mini banner */}
        <div className="flex items-center gap-3 p-2 rounded-xl bg-surface-dark-elevated mb-4">
          <img
            src={video.thumbnailUrl || `/api/proxy/thumbnail/${video.id}`}
            alt={video.title}
            className="w-16 aspect-video rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-zinc-200 truncate">{video.title}</h4>
            <span className="text-[10px] text-zinc-400">{video.channelTitle}</span>
          </div>
        </div>

        {/* URL Box */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-dark-elevated border border-surface-dark-border mb-4">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 bg-transparent px-2 text-xs text-zinc-300 focus:outline-none select-all"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-dutube-500 text-white text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Native Web Share Button */}
        {navigator.share && (
          <button
            onClick={handleNativeShare}
            className="w-full py-2.5 rounded-xl bg-surface-dark-elevated hover:bg-surface-dark-border text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 border border-white/5 active:scale-95 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Open System Share Sheet</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
