import React, { useRef } from 'react';
import { Sparkles } from 'lucide-react';

const CATEGORIES = [
  'All',
  'Trending',
  'Tech',
  'Coding',
  'Music',
  'Gaming',
  'Science',
  'Education',
  'Podcasts',
  'News'
];

const CategoryChips = ({ activeCategory, onSelectCategory }) => {
  const scrollRef = useRef(null);

  return (
    <div className="relative w-full border-b border-white/5 bg-surface-dark/60 py-2.5">
      <div
        ref={scrollRef}
        className="flex items-center gap-2 px-4 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          const isTrending = category === 'Trending';

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all select-none active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-dutube-500 to-dutube-600 text-white font-semibold shadow-md shadow-dutube-500/20'
                  : 'bg-surface-dark-elevated text-zinc-300 hover:text-white hover:bg-surface-dark-border border border-white/5'
              }`}
            >
              {isTrending && <Sparkles className="w-3 h-3 text-amber-400" />}
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryChips;
