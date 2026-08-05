import React from 'react';
import { DomainEvent, Profile } from '../types';
import { NavTab } from './Navbar';
import {
  ShoppingBag,
  Compass,
  BookOpen,
  Sparkles,
  Flame,
  Copy,
  Check,
  Clock,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';

interface Props {
  events: Array<DomainEvent & { actor?: Profile }>;
  onNavigate: (tab: NavTab) => void;
  onOpenOfferModal: () => void;
  currentUser: Profile | null;
}

export const CampfireHome: React.FC<Props> = ({
  events,
  onNavigate,
  onOpenOfferModal,
  currentUser,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText('CAMPFIRE1');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatEventText = (e: DomainEvent & { actor?: Profile }) => {
    const actorName = e.actor?.displayName || 'A neighbor';

    switch (e.eventType) {
      case 'offer.created':
        return `${actorName} offered ${(e.payload.title as string) || 'a new gift'}.`;
      case 'offer.available':
        return `${actorName} reactivated their offer.`;
      case 'project.opened':
        return `${actorName} opened a project: ${(e.payload.title as string) || 'a new project'}.`;
      case 'pledge.proposed':
        return `${actorName} pledged a contribution.`;
      case 'pledge.accepted':
        return `A pledge was accepted by ${actorName}.`;
      case 'pledge.reported_complete':
        return `${actorName} reported their contribution complete.`;
      case 'pledge.confirmed':
        return `${actorName} confirmed a completed contribution.`;
      case 'project.completed':
        return `Project "${(e.payload.title as string) || 'Project'}" was completed!`;
      case 'receipt.created':
        return `${actorName} recorded a permanent receipt.`;
      case 'capacity.created':
        return `New circle capacity unlocked: ${(e.payload.title as string) || 'a new capacity'}.`;
      default:
        return `${actorName} participated in the circle.`;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in">
      {/* Hero Affirmation Banner */}
      <section className="parchment-card-warm rounded-3xl p-6 sm:p-8 border border-[#e2d7c7] relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-800/10 text-amber-900 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
            The First Campfire
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-warm text-3xl sm:text-4xl font-bold text-[#1c1917] tracking-tight leading-snug">
              Welcome around the fire, {currentUser?.displayName || 'Neighbor'}.
            </h2>
            <div className="text-stone-700 font-serif-warm italic text-base sm:text-lg leading-relaxed space-y-1">
              <p>Offer what you can.</p>
              <p>Join what is growing.</p>
              <p>Remember what happened.</p>
            </div>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed font-sans max-w-md pt-1">
            Jubilee Campfire helps a small circle offer real gifts, open shared projects, pledge contributions, and preserve resulting community capacity.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={onOpenOfferModal}
              className="px-4 py-2.5 rounded-xl bg-[#c86d51] hover:bg-[#b05a40] text-amber-50 text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              Put something in the basket
            </button>
          </div>
        </div>
      </section>

      {/* 3 Primary Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Offer */}
        <button
          onClick={() => onNavigate('basket')}
          className="parchment-card rounded-2xl p-6 text-left hover:border-amber-700/40 hover:shadow-md transition-all group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-warm font-bold text-lg text-[#1c1917]">
                Offer
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Put something in the shared basket. Skills, tools, time, spaces, and care.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-semibold text-amber-900 gap-1 pt-2 group-hover:translate-x-1 transition-transform">
            <span>Open Basket</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Join */}
        <button
          onClick={() => onNavigate('projects')}
          className="parchment-card rounded-2xl p-6 text-left hover:border-emerald-700/40 hover:shadow-md transition-all group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-warm font-bold text-lg text-[#1c1917]">
                Join
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Find something the circle is trying to make possible and pledge a contribution.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-semibold text-emerald-900 gap-1 pt-2 group-hover:translate-x-1 transition-transform">
            <span>Explore Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Remember */}
        <button
          onClick={() => onNavigate('remember')}
          className="parchment-card rounded-2xl p-6 text-left hover:border-stone-700/40 hover:shadow-md transition-all group space-y-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-warm font-bold text-lg text-[#1c1917]">
                Remember
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                See what happened, permanent receipts, and new capacities unlocked.
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs font-semibold text-stone-900 gap-1 pt-2 group-hover:translate-x-1 transition-transform">
            <span>View Memory & Capacities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </section>

      {/* Circle Invitation Banner */}
      <section className="parchment-card rounded-2xl p-5 border border-[#e2d7c7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-800/10 text-amber-900 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif-warm font-bold text-sm text-[#1c1917]">
              Invite a trusted neighbor
            </h4>
            <p className="text-xs text-stone-600">
              Private Circle Invitation Code: <code className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">CAMPFIRE1</code>
            </p>
          </div>
        </div>
        <button
          onClick={handleCopyCode}
          className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-medium text-stone-800 flex items-center gap-1.5 transition-colors self-end sm:self-auto shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Code' : 'Copy Invitation Code'}</span>
        </button>
      </section>

      {/* Domain Event Activity Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#e8e2d8] pb-2">
          <h3 className="font-serif-warm text-lg font-bold text-[#1c1917] flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-800" />
            Campfire Activity Log
          </h3>
          <span className="text-xs text-stone-500 font-medium">Domain Memory</span>
        </div>

        {events.length === 0 ? (
          <div className="parchment-card rounded-2xl p-8 text-center text-stone-500 text-xs italic">
            No events recorded yet. Offer something or open a project to begin!
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.slice(0, 8).map((evt) => (
              <div
                key={evt.id}
                className="parchment-card rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                      evt.actor?.avatarColor || 'bg-stone-700 text-stone-50'
                    }`}
                  >
                    {evt.actor ? evt.actor.displayName.substring(0, 2).toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className="font-medium text-[#1c1917] leading-relaxed">
                      {formatEventText(evt)}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {new Date(evt.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-mono shrink-0">
                  {evt.aggregateType}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
