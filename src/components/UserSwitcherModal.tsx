import React, { useState } from 'react';
import { Profile } from '../types';
import { getCurrentUserId, setCurrentUserId, api } from '../lib/api';
import { User, RefreshCw, X, Check, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  onUserChanged: (newProfile: Profile) => void;
  onResetSeed: () => void;
}

export const UserSwitcherModal: React.FC<Props> = ({
  isOpen,
  onClose,
  profiles,
  onUserChanged,
  onResetSeed,
}) => {
  const [customName, setCustomName] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeUserId = getCurrentUserId();

  const handleSelectUser = (profile: Profile) => {
    setCurrentUserId(profile.id);
    onUserChanged(profile);
    onClose();
  };

  const handleLoginCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(customName.trim(), customNote.trim());
      setCurrentUserId(res.profile.id);
      onUserChanged(res.profile);
      setCustomName('');
      setCustomNote('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to join circle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="parchment-card w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[#e8e2d8] pb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-800" />
            <h2 className="font-serif-warm text-xl font-bold text-[#1c1917]">
              Neighbor Identity
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-3">
            Switch Seed Neighbor (Testing Mode)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profiles.map((p) => {
              const isSelected = p.id === activeUserId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectUser(p)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-amber-800 bg-amber-50/80 shadow-xs ring-1 ring-amber-800/20'
                      : 'border-[#e2d7c7] bg-white hover:bg-stone-50/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        p.avatarColor || 'bg-amber-800 text-amber-50'
                      }`}
                    >
                      {p.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-[#1c1917] truncate">
                        {p.displayName}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate">
                        {p.note || 'Circle Member'}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-800 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#e8e2d8] pt-4 space-y-3">
          <p className="text-xs uppercase tracking-wider font-semibold text-stone-500">
            Join as New Neighbor
          </p>
          <form onSubmit={handleLoginCustom} className="space-y-3">
            <div>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Your Name (e.g. Sarah)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-[#fbf9f5] text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
              />
            </div>
            <div>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Small note (e.g. Woodworker & gardener)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-[#fbf9f5] text-sm text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-amber-800/40"
              />
            </div>
            {error && <p className="text-xs text-red-700 font-medium">{error}</p>}
            <button
              type="submit"
              disabled={loading || !customName.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#2c2825] hover:bg-[#1c1917] text-amber-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Enter The First Campfire
            </button>
          </form>
        </div>

        <div className="border-t border-[#e8e2d8] pt-4 flex justify-between items-center">
          <span className="text-xs text-stone-500">Need to restart state?</span>
          <button
            onClick={() => {
              if (confirm('Reset circle data back to default demo state?')) {
                onResetSeed();
                onClose();
              }
            }}
            className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Seed Data
          </button>
        </div>
      </div>
    </div>
  );
};
