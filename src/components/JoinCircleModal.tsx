import React, { useState, useEffect } from 'react';
import { api, setCurrentUserId } from '../lib/api';
import { Profile, Circle } from '../types';
import {
  UserPlus,
  X,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onJoined: (profile: Profile, circle: Circle) => void;
}

export const JoinCircleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialCode = '',
  onJoined,
}) => {
  const [code, setCode] = useState(initialCode);
  const [displayName, setDisplayName] = useState('');
  const [note, setNote] = useState('');
  const [validating, setValidating] = useState(false);
  const [validatedData, setValidatedData] = useState<{
    circle: Circle;
    inviter?: Profile;
    invitation?: any;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      handleValidateCode(initialCode);
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleValidateCode = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) {
      setValidatedData(null);
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await api.validateInvitationCode(codeToValidate.trim());
      setValidatedData({
        circle: res.circle,
        inviter: res.inviter,
        invitation: res.invitation,
      });
    } catch (err: any) {
      setValidatedData(null);
      setError(err.message || 'Invalid or expired invitation code.');
    } finally {
      setValidating(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.joinCircleWithInvitation({
        code: code.trim(),
        displayName: displayName.trim() || undefined,
        note: note.trim() || undefined,
      });

      if (result.profile) {
        setCurrentUserId(result.profile.id);
      }

      onJoined(result.profile, result.circle);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not join circle. Please check the invite code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="parchment-card-warm w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8 relative animate-in fade-in zoom-in-95 border border-[#e2d7c7]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1.5 border-b border-[#e8e2d8] pb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#c86d51]" />
            <h2 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
              Join a Private Circle
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Enter an invitation code or link from a neighbor to sit by the campfire.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleJoinSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Circle Invitation Code *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  handleValidateCode(e.target.value);
                }}
                placeholder="e.g. CAMPFIRE1 or CAMP-X89A"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-800/40"
              />
            </div>
          </div>

          {/* Validated Circle Box */}
          {validating && (
            <div className="text-xs text-stone-500 font-serif-warm italic py-2">
              Verifying invitation code with the campfire...
            </div>
          )}

          {validatedData && (
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
                <div>
                  <h3 className="font-serif-warm font-bold text-sm text-emerald-950">
                    {validatedData.circle.name}
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Invited by {validatedData.inviter?.displayName || 'a trusted neighbor'}
                  </p>
                </div>
              </div>
              {validatedData.invitation?.note && (
                <p className="text-xs text-emerald-900 italic font-serif-warm bg-white/60 p-2 rounded-xl">
                  "{validatedData.invitation.note}"
                </p>
              )}
            </div>
          )}

          {/* Participant Info */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Your Name / Preferred Call Sign *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Sarah, David, or Cedar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Short Note or Interests (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Love gardening, have a lawnmower, love folk music"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !code.trim() || !displayName.trim()}
            className="w-full py-3 px-5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-amber-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            {submitting ? 'Entering Circle...' : 'Accept Invite & Take a Seat by the Fire'}
          </button>
        </form>
      </div>
    </div>
  );
};
