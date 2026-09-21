import React, {useEffect, useMemo, useState} from 'react';
import {
  availableActions,
  demandPressure,
} from '../../specimens/grace-001/culture.ts';
import {
  receiptOpportunityCost,
} from '../../specimens/grace-001/dogramBridge.ts';
import {
  appendEvent,
  decodeSession,
  emptySession,
  encodeSession,
  GRACE_SESSION_STORAGE_KEY,
  replaySession,
  type GraceSession,
  type GraceSessionInputEvent,
} from '../../specimens/grace-001/session.ts';

const stockLabels: Record<string, string> = {
  time: 'Time',
  cash: 'Cash',
  food: 'Food',
  transport: 'Transport',
  attention: 'Attention',
};

function loadSession(): GraceSession {
  if (typeof window === 'undefined') return emptySession();
  try {
    const raw = window.localStorage.getItem(GRACE_SESSION_STORAGE_KEY);
    if (!raw) return emptySession();
    const session = decodeSession(raw);
    replaySession(session);
    return session;
  } catch {
    return emptySession();
  }
}

export function GraceCampaignPanel() {
  const [session, setSession] = useState<GraceSession>(() => loadSession());
  const [error, setError] = useState<string | null>(null);
  const replayed = useMemo(() => replaySession(session), [session]);
  const {story, culture, meaning, lastProposal} = replayed;

  const focus = story.threads.find((thread) => thread.id === story.foregroundThreadId);
  const pressure = useMemo(() => demandPressure(culture), [culture]);
  const actions = useMemo(() => availableActions(culture), [culture]);
  const economyReceipt = culture.history.at(-1) ?? null;

  const mechanicsWitness = useMemo(() => {
    const last = session.events.at(-1);
    if (!last || last.type !== 'economy_action') return null;
    const prior: GraceSession = {...session, events: session.events.slice(0, -1)};
    const before = replaySession(prior).culture;
    return receiptOpportunityCost(before, culture);
  }, [session, culture]);

  useEffect(() => {
    window.localStorage.setItem(GRACE_SESSION_STORAGE_KEY, encodeSession(session));
  }, [session]);

  const commit = (...events: GraceSessionInputEvent[]) => {
    try {
      setError(null);
      let next = session;
      for (const event of events) next = appendEvent(next, event);
      replaySession(next);
      setSession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const reset = () => {
    const next = emptySession();
    setSession(next);
    setError(null);
    window.localStorage.setItem(GRACE_SESSION_STORAGE_KEY, encodeSession(next));
  };

  const latestDream = meaning.dreams.at(-1);
  const latestReturn = meaning.returns.at(-1);
  const latestRememberedWord = meaning.cards.at(-1);

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-amber-200 bg-white/85 shadow-sm">
      <div className="border-b border-amber-100 bg-amber-50/80 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">GRACE-001 · persisted campaign</p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-900">An Ordinary Tuesday</h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-600">
              One thing in focus. Many real demands. Every choice spends something. Every move leaves a replayable receipt.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => commit({type: 'dm_roll', seed: session.events.length + 42})}
              className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Roll pressure
            </button>
            <button
              onClick={reset}
              className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100"
            >
              Reset Tuesday
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-stone-500">Append-only local log · {session.events.length} events</p>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">OTAAT focus</p>
            <p className="mt-1 text-lg font-semibold text-stone-900">{focus?.label ?? 'None'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {story.threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => commit({type: 'focus', threadId: thread.id})}
                  className={
                    thread.id === story.foregroundThreadId
                      ? 'rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white'
                      : 'rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700'
                  }
                >
                  {thread.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Recharge / wild cards</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => commit(
                  {type: 'story_card', cardId: 'practice.pray'},
                  {type: 'economy_action', actionId: 'prayer-block'},
                )}
                className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-3 text-left"
              >
                <span className="block text-sm font-semibold text-violet-950">Pray</span>
                <span className="mt-1 block text-xs text-violet-800">Costs 1 time. Restore attention + resilience; external facts stay external.</span>
              </button>
              <button
                onClick={() => commit(
                  {type: 'story_card', cardId: 'practice.rest'},
                  {type: 'economy_action', actionId: 'rest-block'},
                )}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-left"
              >
                <span className="block text-sm font-semibold text-emerald-950">Rest</span>
                <span className="mt-1 block text-xs text-emerald-800">Costs 2 time. Recover now so later choices are not made from zero.</span>
              </button>
              <button
                onClick={() => commit({type: 'story_card', cardId: 'wild.no-optimize'})}
                className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-3 text-left sm:col-span-2"
              >
                <span className="block text-sm font-semibold text-fuchsia-950">MADDcl0wn: YOU MAY NOT OPTIMIZE THIS</span>
                <span className="mt-1 block text-xs text-fuchsia-800">Hide numeric projections for three turns without erasing underlying state.</span>
              </button>
            </div>
          </div>

          {lastProposal && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">DM proposal · d20 {lastProposal.roll}</p>
              <p className="mt-1 font-semibold text-sky-950">{lastProposal.pressure}</p>
              <p className="mt-2 text-xs text-sky-800">
                Proposal only. The roll does not make this event occur or authorize a crossing.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">MADDJack · meaning current</p>
            {!latestDream ? (
              <>
                <p className="mt-2 text-sm text-indigo-950">No dream witness retained yet.</p>
                <button
                  onClick={() => commit({type: 'dream_red_door'})}
                  className="mt-3 rounded-full bg-indigo-950 px-4 py-2 text-xs font-semibold text-white"
                >
                  Dream the Red Door
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm font-semibold text-indigo-950">{latestDream.title}</p>
                <p className="mt-1 text-xs text-indigo-900">{latestDream.experienced.join(' · ')}</p>
                <p className="mt-2 text-xs text-indigo-700">Interpretation: {latestDream.interpretation}</p>
                {!latestReturn && (
                  <button
                    onClick={() => commit({type: 'upper_room_return', dreamId: latestDream.id})}
                    className="mt-3 rounded-full bg-indigo-950 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Carry it into Upper Room
                  </button>
                )}
              </>
            )}

            {latestReturn && (
              <div className="mt-4 border-t border-indigo-200 pt-3">
                <p className="text-xs font-semibold text-indigo-950">Upper Room return · {latestReturn.scriptureAnchor}</p>
                <p className="mt-1 text-xs text-indigo-800">
                  The text anchor and prayer are witnessed; the dream interpretation remains open.
                </p>
                {!latestRememberedWord && (
                  <button
                    onClick={() => commit({type: 'remembered_word', returnId: latestReturn.id})}
                    className="mt-3 rounded-full border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-950"
                  >
                    Make REMEMBERED WORD card
                  </button>
                )}
              </div>
            )}

            {latestRememberedWord && (
              <div className="mt-4 rounded-xl border border-indigo-300 bg-white p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600">Generation {latestRememberedWord.generation}</p>
                <p className="mt-1 font-semibold text-indigo-950">{latestRememberedWord.title}</p>
                <p className="mt-1 text-xs text-indigo-700">{latestRememberedWord.scriptureAnchor}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Supply</p>
                <p className="mt-1 text-sm text-stone-600">Hard limits for this slice.</p>
              </div>
              <p className="text-xs font-medium text-rose-700">Demand {pressure.total} · required {pressure.required}</p>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Object.entries(culture.stocks).map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-stone-100 px-2 py-3 text-center">
                  <div className="text-lg font-semibold text-stone-900">{key === 'cash' ? '$' : ''}{value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-stone-500">{stockLabels[key] ?? key}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Make one hard choice</p>
            <div className="mt-2 space-y-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => commit({type: 'economy_action', actionId: action.id})}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left hover:bg-stone-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold text-stone-900">{action.label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-stone-500">{action.id}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-600">{action.note}</p>
                </button>
              ))}
            </div>
          </div>

          {economyReceipt && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-orange-800">Opportunity-cost receipt</p>
              <p className="mt-1 text-sm font-semibold text-orange-950">{economyReceipt.actionId}</p>
              <p className="mt-2 text-xs text-orange-900">
                Foreclosed now:{' '}
                {economyReceipt.opportunityCost.length > 0
                  ? economyReceipt.opportunityCost.join(', ')
                  : 'no previously affordable action became unavailable'}
              </p>
              <p className="mt-1 text-xs text-orange-900">
                Still unresolved: {economyReceipt.residualDemands.join(', ') || 'none in this declared scope'}
              </p>
            </div>
          )}

          {mechanicsWitness && (
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Dogram-style mechanics witness</p>
              <p className="mt-1 text-xs text-cyan-950">Experiment: {mechanicsWitness.experiment}</p>
              <p className="mt-2 text-xs text-cyan-900">
                Successors foreclosed: {mechanicsWitness.foreclosed.join(', ') || 'none'}
              </p>
              <p className="mt-1 text-xs text-cyan-700">Authority: none · mechanics delta only</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Culture forming</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(culture.traces).map(([trace, value]) => (
                <span key={trace} className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
                  {trace.replaceAll('_', ' ')} · {value}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">
              These traces describe repeated practices. They are not scores of human worth.
            </p>
          </div>
        </div>
      </div>

      {error && <div className="border-t border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800">{error}</div>}
    </section>
  );
}
