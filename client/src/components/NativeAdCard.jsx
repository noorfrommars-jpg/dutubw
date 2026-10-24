import React, { useEffect, useRef } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { adsService } from '../services/adsService';
import { analyticsService } from '../services/analyticsService';

const NativeAdCard = ({ ad }) => {
  const reportedImpression = useRef(false);

  useEffect(() => {
    if (!reportedImpression.current && ad?.id) {
      reportedImpression.current = true;
      adsService.trackImpression(ad.id);
      analyticsService.track('native_ad_impression', {
        adId: ad.id,
        sponsor: ad.sponsor_name,
        title: ad.title
      });
    }
  }, [ad]);

  if (!ad) return null;

  const handleCtaClick = (e) => {
    e.stopPropagation();
    adsService.trackClick(ad.id);
    analyticsService.track('native_ad_click', {
      adId: ad.id,
      sponsor: ad.sponsor_name,
      ctaUrl: ad.cta_url
    });
    window.open(ad.cta_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full pb-4 pt-1 border-b border-surface-dark-border/40">
      <div className="rounded-2xl bg-gradient-to-b from-[#181B22] to-[#121418] border border-amber-500/20 hover:border-amber-500/40 transition-colors p-3.5 shadow-lg relative overflow-hidden group">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top Sponsor Info */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-surface-dark-border flex-shrink-0 border border-white/10">
              <img
                src={ad.sponsor_logo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=80'}
                alt={ad.sponsor_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://api.dicebear.com/7.x/identicon/svg?seed=AdSponsor';
                }}
              />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-200 block leading-tight">
                {ad.sponsor_name}
              </span>
              <span className="text-[10px] text-zinc-400">Sponsored Brand</span>
            </div>
          </div>

          {/* Distinct Sponsored Badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-2.5 h-2.5" />
            <span>Ad</span>
          </div>
        </div>

        {/* Ad Title & Copy */}
        <h4 className="text-sm font-bold text-zinc-100 group-hover:text-amber-300 transition-colors mb-1 leading-snug">
          {ad.title}
        </h4>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
          {ad.description}
        </p>

        {/* Ad Creative Image Banner */}
        {ad.creative_url && (
          <div
            onClick={handleCtaClick}
            className="w-full aspect-[16/8] rounded-xl overflow-hidden bg-black/40 mb-3 cursor-pointer relative"
          >
            <img
              src={ad.creative_url}
              alt={ad.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* CTA Button Row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-zinc-400">DuTube Native Ads</span>
          <button
            onClick={handleCtaClick}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold tracking-tight shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <span>{ad.cta_text || 'Learn More'}</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NativeAdCard;
