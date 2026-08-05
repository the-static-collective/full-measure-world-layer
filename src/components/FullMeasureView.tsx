import React, { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleDot,
  Compass,
  Copy,
  Eye,
  Flame,
  Gift,
  Hammer,
  Link2,
  Map,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRoundCog,
  Wheat,
} from 'lucide-react';
import {
  Capacity,
  DomainEvent,
  Offer,
  Pledge,
  Profile,
  Project,
  Receipt,
} from '../types';
import {
  buildFullMeasureSheet,
  countProjectTraces,
  findGardenQuest,
  MeasureKey,
} from '../lib/fullMeasure';
import { NavTab } from './Navbar';

interface Props {
  currentUser: Profile | null;
  offers: Array<Offer & { author?: Profile }>;
  projects: Array<
    Project & {
      opener?: Profile;
      pledges: Array<Pledge & { pledger?: Profile }>;
    }
  >;
  receipts: Array<Receipt & { project?: Project; author?: Profile }>;
  capacities: Array<Capacity & { receipt?: Receipt; project?: Project }>;
  events: Array<DomainEvent & { actor?: Profile }>;
  onSelectProject: (projectId: string) => void;
  onNavigate: (tab: NavTab) => void;
  onOpenUserSwitcher: () => void;
}

const MEASURE_ICONS: Record<MeasureKey, LucideIcon> = {
  gift: Gift,
  quest: Map,
  deed: Hammer,
  seed: Sprout,
  witness: Eye,
  harvest: Wheat,
};

const QUEST_STEPS = ['Tension', 'Pledge', 'Accepted', 'Report', 'Witness', 'Harvest'];

const traceText = (event: DomainEvent & { actor?: Profile }) => {
  const actor = event.actor?.displayName || 'A neighbor';

  switch (event.eventType) {
    case 'offer.created':
      return `${actor} placed a gift in the basket.`;
    case 'project.opened':
      return `${actor} opened a seed.`;
    case 'pledge.proposed':
      return `${actor} answered a tension.`;
    case 'pledge.accepted':
      return `${actor} welcomed a pledge.`;
    case 'pledge.reported_complete':
      return `${actor} returned with a field report.`;
    case 'pledge.confirmed':
      return `${actor} witnessed a completed deed.`;
    case 'receipt.created':
      return `${actor} sealed a harvest receipt.`;
    case 'capacity.created':
      return `${actor} recorded new shared capacity.`;
    default:
      return `${actor} left a trace in the garden.`;
  }
};

export const FullMeasureView: React.FC<Props> = ({
  currentUser,
  offers,
  projects,
  receipts,
  capacities,
  events,
  onSelectProject,
  onNavigate,
  onOpenUserSwitcher,
}) => {
  const [copied, setCopied] = useState(false);
  const userId = currentUser?.id ?? '';
  const sheet = useMemo(
    () =>
      buildFullMeasureSheet({
        userId,
        offers,
        projects,
        receipts,
        capacities,
        events,
      }),
    [userId, offers, projects, receipts, capacities, events]
  );
  const quest = useMemo(
    () => (userId ? findGardenQuest(userId, projects) : null),
    [userId, projects]
  );

  const portableSeed = quest?.project.addressHash ?? (
    quest ? `jubilee://seed/${quest.project.id}` : ''
  );
  const openTensions =
    quest?.project.needs.filter(
      (need) => need.status !== 'met' && need.status !== 'withdrawn'
    ).length ?? 0;
  const traceCount = quest ? countProjectTraces(quest.project.id, events) : 0;
  const recentTraces = [...events]
    .filter(
      (event) =>
        event.actorId === userId ||
        event.payload.pledgedBy === userId ||
        (quest &&
          (event.aggregateId === quest.project.id ||
            event.payload.projectId === quest.project.id))
    )
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, 4);

  const copyPortableSeed = async () => {
    if (!portableSeed) return;
    await navigator.clipboard.writeText(portableSeed);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      <section className="garden-hero rounded-[2rem] p-6 sm:p-8 text-[#fffaf0] overflow-hidden relative">
        <div className="absolute -right-14 -top-20 w-64 h-64 rounded-full border border-amber-100/10" />
        <div className="absolute right-8 -bottom-20 w-52 h-52 rounded-full border border-emerald-100/10" />
        <div className="relative z-10 max-w-xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/10 border border-amber-100/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">
              <Sparkles className="w-3.5 h-3.5" />
              Full Measure
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/15 border border-white/10 px-3 py-1 text-[10px] font-semibold tracking-wide text-emerald-50">
              <CircleDot className="w-3 h-3 text-amber-300" />
              Prototype · This device
            </span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/75 font-semibold mb-2">
              The Garden
            </p>
            <h2 className="font-serif-warm text-4xl sm:text-5xl font-bold tracking-tight leading-[0.98]">
              Your life leaves a living trail.
            </h2>
          </div>

          <p className="text-sm sm:text-base text-emerald-50/85 leading-relaxed max-w-lg">
            Choose a real tension. Bring what you can. Return with a report. Let
            another human witness the deed. Only then does the measure grow.
          </p>
        </div>
      </section>

      <section className="parchment-card rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm ${
                currentUser?.avatarColor || 'bg-amber-800 text-amber-50'
              }`}
            >
              {currentUser?.displayName.substring(0, 2).toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500 font-bold">
                Character · Chapter {sheet.chapter}
              </p>
              <h3 className="font-serif-warm text-2xl font-bold text-[#1c1917]">
                {currentUser?.displayName || 'Neighbor'}
              </h3>
              <p className="text-xs text-emerald-800 font-semibold">
                {sheet.role} <span className="text-stone-400 font-normal">· role emerging from traces</span>
              </p>
            </div>
          </div>

          <button
            onClick={onOpenUserSwitcher}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl border border-[#d8cebe] bg-[#fbf8f3] px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <UserRoundCog className="w-4 h-4 text-amber-800" />
            Pass the fire
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold">
            <span className="text-stone-500">
              {sheet.witnessedProgress} witnessed marks
            </span>
            <span className="text-emerald-800">
              {sheet.nextChapterAt === null
                ? 'Full chapter'
                : `${sheet.nextChapterAt - sheet.witnessedProgress} to ${(
                    ['Seed', 'Sprout', 'Growing', 'Flowering', 'Harvest'] as const
                  )[
                    Math.min(
                      4,
                      ['Seed', 'Sprout', 'Growing', 'Flowering', 'Harvest'].indexOf(
                        sheet.chapter
                      ) + 1
                    )
                  ]}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-[#c86d51] to-emerald-700 transition-all duration-500"
              style={{ width: `${sheet.chapterProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {sheet.measures.map((measure) => {
            const Icon = MEASURE_ICONS[measure.key];
            return (
              <div
                key={measure.key}
                title={measure.description}
                className="rounded-2xl border border-[#e8e2d8] bg-[#fcfaf6] px-2 py-3 text-center"
              >
                <Icon className="w-4 h-4 mx-auto text-amber-800 mb-1.5" />
                <div className="font-serif-warm text-xl font-bold text-[#1c1917] leading-none">
                  {measure.value}
                </div>
                <div className="text-[9px] uppercase tracking-wider font-bold text-stone-500 mt-1">
                  {measure.label}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-stone-500 leading-relaxed border-t border-[#eee8df] pt-3">
          No leaderboard. No streak. No hidden score. Every mark must resolve to a
          durable participation trace.
        </p>
      </section>

      {quest ? (
        <section className="parchment-card-warm rounded-3xl border border-[#e2d7c7] overflow-hidden">
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-800">
                  {quest.eyebrow}
                </p>
                <h3 className="font-serif-warm text-2xl sm:text-3xl font-bold text-[#1c1917] mt-1">
                  {quest.project.title}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full border border-stone-300 bg-white px-2.5 py-1 text-[10px] font-bold text-stone-600">
                  Seed
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    quest.truthState === 'Human witnessed' ||
                    quest.truthState === 'Current form'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : quest.truthState === 'Proposal'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-200'
                  }`}
                >
                  {quest.truthState}
                </span>
              </div>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">
              {quest.project.story}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="rounded-2xl bg-white/75 border border-[#e2d7c7] p-3">
                <p className="text-[9px] uppercase tracking-wider font-bold text-stone-500">
                  How did this become?
                </p>
                <p className="font-serif-warm font-bold text-sm text-[#1c1917] mt-1">
                  {traceCount} durable {traceCount === 1 ? 'trace' : 'traces'}
                </p>
              </div>
              <div className="rounded-2xl bg-white/75 border border-[#e2d7c7] p-3">
                <p className="text-[9px] uppercase tracking-wider font-bold text-stone-500">
                  What remains unresolved?
                </p>
                <p className="font-serif-warm font-bold text-sm text-[#1c1917] mt-1">
                  {openTensions} open {openTensions === 1 ? 'tension' : 'tensions'}
                </p>
              </div>
              <div className="rounded-2xl bg-white/75 border border-[#e2d7c7] p-3">
                <p className="text-[9px] uppercase tracking-wider font-bold text-stone-500">
                  Where participate next?
                </p>
                <p className="font-serif-warm font-bold text-sm text-emerald-900 mt-1">
                  {quest.nextAction}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="min-w-[560px] flex items-start">
                {QUEST_STEPS.map((step, index) => {
                  const complete = index < quest.currentStep;
                  const current = index === quest.currentStep;
                  return (
                    <React.Fragment key={step}>
                      <div className="w-[78px] text-center shrink-0">
                        <div
                          className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center border-2 text-[10px] font-bold ${
                            complete
                              ? 'bg-emerald-800 border-emerald-800 text-white'
                              : current
                                ? 'bg-amber-100 border-amber-700 text-amber-900'
                                : 'bg-white border-stone-300 text-stone-400'
                          }`}
                        >
                          {complete ? <Check className="w-3.5 h-3.5" /> : index + 1}
                        </div>
                        <p
                          className={`text-[9px] uppercase tracking-wider font-bold mt-1.5 ${
                            current ? 'text-amber-900' : 'text-stone-500'
                          }`}
                        >
                          {step}
                        </p>
                      </div>
                      {index < QUEST_STEPS.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mt-3.5 ${
                            index < quest.currentStep
                              ? 'bg-emerald-700'
                              : 'bg-stone-300'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {quest.project.futurePossibility && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex gap-3">
                <Sprout className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-800">
                    If this succeeds
                  </p>
                  <p className="font-serif-warm italic text-sm text-emerald-950 mt-0.5">
                    {quest.project.futurePossibility}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => onSelectProject(quest.project.id)}
                className="flex-1 rounded-2xl bg-[#1f513b] hover:bg-[#17422f] text-emerald-50 px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Compass className="w-4 h-4" />
                {quest.nextAction}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={copyPortableSeed}
                className="rounded-2xl border border-[#d8cebe] bg-white hover:bg-stone-50 text-stone-700 px-4 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'BananaGram copied' : 'Carry as BananaGram'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-stone-500 font-mono truncate">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{portableSeed}</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="parchment-card rounded-3xl p-8 text-center">
          <Sprout className="w-8 h-8 mx-auto text-emerald-700 mb-3" />
          <h3 className="font-serif-warm text-xl font-bold">The garden is quiet.</h3>
          <p className="text-xs text-stone-600 mt-2">
            Open a seed when a real tension becomes clear.
          </p>
          <button
            onClick={() => onNavigate('projects')}
            className="mt-4 rounded-xl bg-emerald-800 text-white px-4 py-2 text-xs font-bold"
          >
            Open the quest garden
          </button>
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('basket')}
          className="parchment-card rounded-2xl p-4 text-left group"
        >
          <PackageOpen className="w-5 h-5 text-amber-800" />
          <p className="font-serif-warm font-bold text-base mt-3">Satchel</p>
          <p className="text-[11px] text-stone-500 mt-1">
            Gifts, tools, time, care, and boundaries.
          </p>
        </button>
        <button
          onClick={() => onNavigate('projects')}
          className="parchment-card rounded-2xl p-4 text-left group"
        >
          <Compass className="w-5 h-5 text-emerald-800" />
          <p className="font-serif-warm font-bold text-base mt-3">Quest Garden</p>
          <p className="text-[11px] text-stone-500 mt-1">
            Seeds organized around unresolved tensions.
          </p>
        </button>
        <button
          onClick={() => onNavigate('remember')}
          className="parchment-card rounded-2xl p-4 text-left group"
        >
          <BookOpen className="w-5 h-5 text-stone-800" />
          <p className="font-serif-warm font-bold text-base mt-3">Chronicle</p>
          <p className="text-[11px] text-stone-500 mt-1">
            Traces, human witness, harvests, and lineage.
          </p>
        </button>
      </section>

      <section className="rounded-3xl bg-[#211f1a] text-stone-100 p-5 sm:p-6 grid sm:grid-cols-[auto_1fr] gap-4">
        <div className="w-11 h-11 rounded-2xl bg-amber-100/10 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-200">
            The rule of play
          </p>
          <p className="font-serif-warm text-lg font-bold mt-1">
            Models may propose. Only people may harvest.
          </p>
          <p className="text-xs text-stone-400 leading-relaxed mt-2">
            A report is not proof of itself. Another human must witness it. Full
            Measure does not award invisible XP, infer virtue, or turn private drafts
            into public memory.
          </p>
        </div>
      </section>

      {recentTraces.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-warm text-lg font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-800" />
              Nearby traces
            </h3>
            <button
              onClick={() => onNavigate('remember')}
              className="text-[10px] uppercase tracking-wider font-bold text-emerald-800"
            >
              Open chronicle
            </button>
          </div>
          <div className="space-y-2">
            {recentTraces.map((event) => (
              <div
                key={event.id}
                className="parchment-card rounded-2xl p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <CircleDot className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1c1917] truncate">
                      {traceText(event)}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {new Date(event.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-stone-400 shrink-0">
                  Trace
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
