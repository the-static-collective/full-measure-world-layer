import React, {useMemo, useState} from 'react';
import {
  applyEconomyAction,
  availableActions,
  demandPressure,
  initialCultureState,
  type EconomyReceipt,
} from '../../specimens/grace-001/culture.ts';
import {
  chooseFocus,
  drawQuestProposal,
  initialState,
  playCard,
  type GraceState,
} from '../../specimens/grace-001/kernel.ts';

const stockLabels: Record<string, string> = {
  time: 'Time',
  cash: 'Cash',
  food: 'Food',
  transport: 'Transport',
  attention: 'Attention',
};

export function GraceCampaignPanel() {
  const [story, setStory] = useState<GraceState>(() => initialState());
  const [culture, setCulture] = useState(() => initialCultureState());
  const [seed, setSeed] = useState(42);
  const [proposal, setProposal] = useState<ReturnType<typeof drawQuestProposal> | null>(null);
  const [economyReceipt, setEconomyReceipt] = useState<EconomyReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const focus = story.threads.find((thread) => thread.id === story.foregroundThreadId);
  const pressure = useMemo(() => demandPressure(culture), [culture]);
  const actions = useMemo(() => availableActions(culture), [culture]);

  const chooseEconomyAction = (actionId: string) => {
    try {
      setError(null);
      const nextCulture = applyEconomyAction(culture, actionId);
      setCulture(nextCulture);
      setEconomyReceipt(nextCulture.history.at(-1) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const playStoryCard = (cardId: string) => {
    try {
      setError(null);
      const nextStory = playCard(story, cardId);
      setStory(nextStory);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const playRecharge = (cardId: string, economyActionId: string) => {
    try {
      setError(null);
      const nextStory = playCard(story, cardId);
      const nextCulture = applyEconomyAction(culture, economyActionId);
      setStory(nextStory);
      setCulture(nextCulture);
      setEconomyReceipt(nextCulture.history.at(-1) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const drawPressure = () => {
    const next = drawQuestProposal(story, seed);
    setProposal(next);
    setSeed((current) => current + 1);
  };

  return (
    <section className="mb-6 rounded-3xl border border-amber-200 bg-white/85 shadow-sm overflow-hidden">
      <div className="border-b border-amber-100 bg-amber-50/80 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">GRACE-001 · playable specimen</p>
            <h2 className="mt-1 text-2xl font-semibold text-stone-900">An Ordinary Tuesday</h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-600">
              One thing in focus. Many real demands. Every choice spends something.
            </p>
          </div>
          <button
            onClick={drawPressure}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Roll the next pressure
          </button>
        </div>
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
                  onClick={() => setStory((current) => chooseFocus(current, thread.id))}
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
                onClick={() => playRecharge('practice.pray', 'prayer-block')}
                className="rounded-2xl border border-violet-200 bg-violet-50 px-3 py-3 text-left"
              >
                <span className="block text-sm font-semibold text-violet-950">Pray</span>
                <span className="mt-1 block text-xs text-violet-800">Costs 1 time. Restore attention + resilience; external facts stay external.</span>
              </button>
              <button
                onClick={() => playRecharge('practice.rest', 'rest-block')}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-left"
              >
                <span className="block text-sm font-semibold text-emerald-950">Rest</span>
                <span className="mt-1 block text-xs text-emerald-800">Costs 2 time. Recover now so later choices are not made from zero.</span>
              </button>
              <button
                onClick={() => playStoryCard('wild.no-optimize')}
                className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-3 text-left sm:col-span-2"
              >
                <span className="block text-sm font-semibold text-fuchsia-950">MADDcl0wn: YOU MAY NOT OPTIMIZE THIS</span>
                <span className="mt-1 block text-xs text-fuchsia-800">Hide numeric projections for three turns without erasing underlying state.</span>
              </button>
            </div>
          </div>

          {proposal && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">DM proposal · d20 {proposal.roll}</p>
              <p className="mt-1 font-semibold text-sky-950">{proposal.pressure}</p>
              <p className="mt-2 text-xs text-sky-800">
                Proposal only. The roll does not make this event occur or authorize a crossing.
              </p>
            </div>
          )}
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
                  onClick={() => chooseEconomyAction(action.id)}
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
