import React, { useState, useEffect } from 'react';
import { api, getCurrentUserId } from '../lib/api';
import { Profile, Circle } from '../types';
import {
  UserPlus,
  X,
  Copy,
  Check,
  Sparkles,
  Link,
  ShieldCheck,
  Clock,
  Users,
  QrCode,
  Share2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  circle?: Circle | null;
  currentUser?: Profile | null;
  onInvitationCreated?: () => void;
}

export const BringAFriendModal: React.FC<Props> = ({
  isOpen,
  onClose,
  circle,
  currentUser,
  onInvitationCreated,
}) => {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [note, setNote] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresDays, setExpiresDays] = useState('30');
  const [submitting, setSubmitting] = useState(false);

  // Copy feedback tracking
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeUserId = getCurrentUserId();

  const circleId = circle?.id || 'circle_1';

  const loadInvitations = async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCircleInvitations(circleId);
      setInvitations(data);
    } catch (err: any) {
      console.error('Failed to load invitations:', err);
      setError(err.message || 'Could not fetch active circle invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInvitations();
    }
  }, [isOpen, circleId]);

  if (!isOpen) return null;

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.createCircleInvitation(circleId, {
        note: note.trim() || undefined,
        customCode: customCode.trim() || undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        expiresDays: expiresDays ? Number(expiresDays) : undefined,
      });

      setNote('');
      setCustomCode('');
      setMaxUses('');
      setExpiresDays('30');
      await loadInvitations();
      if (onInvitationCreated) onInvitationCreated();
    } catch (err: any) {
      setError(err.message || 'Could not create invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getInviteLink = (code: string) => {
    const origin = window.location.origin;
    return `${origin}?invite=${encodeURIComponent(code)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="parchment-card-warm w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative animate-in fade-in zoom-in-95 border border-[#e2d7c7]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 border-b border-[#e8e2d8] pb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-amber-800" />
            <h2 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
              Bring a Friend to {circle?.name || 'The Campfire'}
            </h2>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Generate unique invitation links or codes so trusted neighbors can join your private circle.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Main Invite Generator Form */}
        <form onSubmit={handleCreateInvitation} className="space-y-4 bg-white/80 p-5 rounded-2xl border border-[#e2d7c7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-700" />
              Generate Unique Circle Invite Code
            </span>
            <span className="text-[10px] text-stone-500 font-medium">
              Circle ID: <strong className="font-mono text-stone-700">{circleId}</strong>
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
              Personal Welcome Note for Friend (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Join our local neighborhood campfire to share tools, soup, and greenhouse projects!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Custom Code (Optional)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                placeholder="e.g. WOODSIDE"
                className="w-full px-3 py-2 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-800/40 uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Max Uses (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
                Expires In (Days)
              </label>
              <select
                value={expiresDays}
                onChange={(e) => setExpiresDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#d8cebe] bg-white text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40"
              >
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="">Never Expires</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-2xl bg-[#c86d51] hover:bg-[#b05a40] text-amber-50 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 text-amber-200" />
            {submitting ? 'Generating Invite...' : 'Generate New Invitation Link & Code'}
          </button>
        </form>

        {/* List of Active Circle Invitations */}
        <div className="space-y-3 pt-2">
          <h3 className="font-serif-warm font-bold text-base text-[#1c1917] flex items-center justify-between">
            <span>Active Circle Invitations ({invitations.length})</span>
            {circle?.inviteCode && (
              <span className="text-[11px] font-mono font-normal text-stone-500">
                Circle Key: <strong className="text-amber-900">{circle.inviteCode}</strong>
              </span>
            )}
          </h3>

          {loading ? (
            <div className="py-6 text-center text-xs text-stone-500 font-serif-warm italic">
              Loading active invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 font-serif-warm italic border border-dashed border-[#d8cebe] rounded-2xl">
              No custom invitations generated yet. Generate one above to invite a friend!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {invitations.map((inv) => {
                const inviteLink = getInviteLink(inv.code);
                const isCopied = copiedCode === inv.code;

                return (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl border border-[#e2d7c7] bg-white space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          {inv.code}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Created by {inv.creator?.displayName || 'Neighbor'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(inv.code, inv.code)}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center gap-1 font-mono text-[11px] transition-colors"
                          title="Copy Code"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copied Code</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => copyToClipboard(inviteLink, `${inv.code}_link`)}
                          className="px-3 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-amber-50 font-semibold flex items-center gap-1 text-[11px] transition-colors"
                          title="Copy Shareable Link"
                        >
                          {copiedCode === `${inv.code}_link` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-amber-200" />
                              <span>Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5 text-amber-200" />
                              <span>Share Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {inv.note && (
                      <p className="text-stone-600 italic bg-stone-50 p-2 rounded-xl text-[11px] leading-relaxed">
                        "{inv.note}"
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[10px] text-stone-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-stone-400" />
                        {inv.usesCount} {inv.maxUses ? `/ ${inv.maxUses}` : ''} joined
                      </span>
                      {inv.expiresAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
