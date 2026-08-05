import React from 'react';
import { Profile } from '../types';
import {
  Flame,
  Sprout,
  PackageOpen,
  Compass,
  ScrollText,
  UserRound,
  Sparkles,
  UserPlus,
} from 'lucide-react';

export type NavTab = 'campfire' | 'basket' | 'projects' | 'remember' | 'lineage';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentUser: Profile | null;
  onOpenUserSwitcher: () => void;
  onOpenArrivalModal: () => void;
  onOpenBringAFriend: () => void;
  onOpenJoinCircle?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  currentUser,
  onOpenUserSwitcher,
  onOpenArrivalModal,
  onOpenBringAFriend,
  onOpenJoinCircle,
}) => {
  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#fbf8f3]/95 backdrop-blur-md border-b border-[#e8e2d8]">
        <div className="max-w-3xl mx-auto px-4 h-15 flex items-center justify-between">
          {/* Brand Logo & Circle Indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('campfire')}
              className="flex items-center gap-2 group text-left"
            >
              <div className="w-9 h-9 rounded-full bg-amber-800 text-amber-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 fill-amber-300 text-amber-100 animate-pulse" />
              </div>
              <div>
                <h1 className="font-serif-warm font-bold text-base text-[#1c1917] tracking-tight leading-none">
                  Full Measure
                </h1>
                <span className="text-[11px] text-stone-500 tracking-wide font-medium">
                  Jubilee life layer · The First Campfire
                </span>
              </div>
            </button>
          </div>

          {/* User, Bring a Friend & Offer Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onOpenBringAFriend}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-amber-50 text-xs font-semibold shadow-2xs transition-colors"
              title="Invite a friend to this circle"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Bring a Friend</span>
              <span className="sm:hidden">Invite</span>
            </button>

            <button
              onClick={onOpenArrivalModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 text-xs font-semibold border border-amber-300/60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
              Add to your satchel
            </button>

            <button
              onClick={onOpenUserSwitcher}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[#e2d7c7] bg-white hover:bg-stone-50 shadow-2xs transition-all"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  currentUser?.avatarColor || 'bg-amber-800 text-amber-50'
                }`}
              >
                {currentUser ? currentUser.displayName.substring(0, 2).toUpperCase() : '?'}
              </div>
              <span className="text-xs font-semibold text-[#1c1917] max-w-[80px] truncate">
                {currentUser?.displayName || 'Select User'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Mobile Primary Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#fbf8f3]/95 backdrop-blur-md border-t border-[#e8e2d8] px-2 py-1.5 sm:py-2 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          <button
            onClick={() => onTabChange('campfire')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'campfire'
                ? 'text-amber-900 bg-amber-100/70 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sprout className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Garden</span>
          </button>

          <button
            onClick={() => onTabChange('basket')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'basket'
                ? 'text-amber-900 bg-amber-100/70 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <PackageOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Satchel</span>
          </button>

          <button
            onClick={() => onTabChange('projects')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'projects'
                ? 'text-amber-900 bg-amber-100/70 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Compass className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Quests</span>
          </button>

          <button
            onClick={() => onTabChange('remember')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'remember'
                ? 'text-amber-900 bg-amber-100/70 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <ScrollText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Chronicle</span>
          </button>

          <button
            onClick={() => onTabChange('lineage')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
              activeTab === 'lineage'
                ? 'text-amber-900 bg-amber-100/70 font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <UserRound className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Character</span>
          </button>
        </div>
      </nav>
    </>
  );
};
