import React from 'react';
import { Home, Tv2, Library, User } from 'lucide-react';

const BottomNav = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'subscriptions', label: 'Subscriptions', icon: Tv2 },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'me', label: 'Me', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface-dark/95 backdrop-blur-lg border-t border-surface-dark-border/60 pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-around h-14 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all group relative active:scale-95 ${
                isActive ? 'text-dutube-500 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-dutube-500 stroke-[2.4]' : 'group-hover:scale-105'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-dutube-500 shadow-sm shadow-dutube-500" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight transition-colors ${
                isActive ? 'text-dutube-400 font-semibold' : 'text-zinc-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
