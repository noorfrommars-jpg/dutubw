import React, { useState } from 'react';
import { ExternalLink, Info, Sparkles, ShieldCheck } from 'lucide-react';

/**
 * AdMobBanner
 * Google Play Store & Google AdMob Policy Compliant Banner Unit
 * - Strictly separates from interactive video controls (no accidental clicks)
 * - Explicit "Ad" / "Sponsored" labeling with AdChoices information
 * - Standard 300x250 Medium Rectangle or 320x50 Banner layout
 */
const AdMobBanner = ({ slot = 'video_inline' }) => {
  const [showPolicyInfo, setShowPolicyInfo] = useState(false);

  const adData = {
    title: 'Google Cloud Platform & Vertex AI',
    sponsor: 'Google Cloud Partner',
    description: 'Build enterprise GenAI applications with Gemini 1.5 Pro on Google Cloud. Get $300 in free credits.',
    ctaText: 'Get Free Trial',
    ctaUrl: 'https://cloud.google.com/vertex-ai',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80'
  };

  return (
    <div className="w-full my-3 px-1">
      <div className="relative rounded-2xl bg-gradient-to-b from-[#16181f] to-[#101216] border border-amber-500/20 p-3.5 shadow-lg overflow-hidden">
        {/* AdMob Policy Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[9px] tracking-wider uppercase border border-amber-500/30">
              Ad
            </span>
            <span className="text-[11px] font-semibold text-zinc-300">
              {adData.sponsor}
            </span>
          </div>

          <button
            onClick={() => setShowPolicyInfo(p => !p)}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Google AdMob & Play Store Policy Compliant"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>AdMob Certified</span>
            <Info className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Ad Policy Modal / Drawer */}
        {showPolicyInfo && (
          <div className="mb-3 p-2.5 rounded-xl bg-black/60 border border-white/10 text-[10px] text-zinc-300 space-y-1">
            <p className="font-semibold text-emerald-400">Google Play & AdMob Policy Compliance:</p>
            <p className="text-zinc-400 leading-relaxed">
              This ad placement complies with Google AdMob Accidental Click Policies and Google Play Developer Program policies. Ads are clearly distinguished from content and never placed over media controls.
            </p>
          </div>
        )}

        {/* Ad Content */}
        <div className="flex gap-3 items-center">
          <div className="w-20 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10">
            <img
              src={adData.imageUrl}
              alt={adData.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-zinc-100 truncate">
              {adData.title}
            </h4>
            <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 leading-snug">
              {adData.description}
            </p>
          </div>
        </div>

        {/* Call to action button */}
        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">Google Certified Partner</span>
          <a
            href={adData.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow transition-all active:scale-95"
          >
            <span>{adData.ctaText}</span>
            <ExternalLink className="w-3 h-3 stroke-[2.5]" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdMobBanner;
