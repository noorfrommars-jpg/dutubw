import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="w-full pb-4 border-b border-surface-dark-border/30 animate-pulse">
      {/* 16:9 Thumbnail Skeleton */}
      <div className="w-full aspect-video rounded-2xl bg-surface-dark-elevated animate-shimmer" />

      {/* Info Row Skeleton */}
      <div className="flex items-start gap-3 mt-3 px-1">
        <div className="w-9 h-9 rounded-full bg-surface-dark-elevated flex-shrink-0 animate-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-dark-elevated rounded-md w-11/12 animate-shimmer" />
          <div className="h-3 bg-surface-dark-elevated rounded-md w-3/5 animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
