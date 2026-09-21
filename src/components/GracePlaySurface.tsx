import React, {useMemo, useState} from 'react';

import {
  deriveDayAttendance,
  deriveEncounterOffer,
  derivePlayActions,
  derivePlayScene,
  deriveWorldResponseOffer,
  previewPlayAction,
  resolvePlayAction,
  resolveWorldResponse,
  type ConsequenceBeat,
  type PlayActionId,
} from '../../specimens/grace-001/playExperience.ts';
import type {WorldResponseDisposition} from '../../specimens/grace-001/kernel.ts';
import {
  replaySession,
  type GraceSession,
  type GraceSessionInputEvent,
} from '../../specimens/grace-001/session.ts';

interface GracePlaySurfaceProps {
  session: GraceSession;
  commit: (...events: GraceSessionInputEvent[]) => void;
}

interface WorldResponseBeat {
  title: string;
  lines: string[];
}

function costText(cost: Record<string, number | undefined>): string {
  return Object.entries(cost)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .map(([key, value]) => key === 'cash' ? `$${value}` : `${value} ${key}`)
    .join(' · ');
}

function beatForWorldResponse(disposition: WorldResponseDisposition): WorldResponseBeat {
  switch (disposition) {
    case 'answer':
      return {
        title: 'A window opens',
        lines: [
          'Grace answers the returning call.',
          'A housing appointment is offered.',
          'Eligibility and housing itself are still unresolved.',
        ],
      };
    case 'let-ring':
      return {
        title: 'The phone stops ringing',
        lines: [
          'The callback happened.',
          'Grace did not answer it in this moment.',
          'The housing need remains open; unanswered is not the same as refused.',
        ],
      };
    case 'hold-tomorrow':
      return {
        title: 'Tomorrow gets a return address',
        lines: [
          'Grace does not force the callback into the remainder of tonight.',
          'The response is deferred rather than completed or erased.',
          'The housing need remains addressable tomorrow.',
        ],
      };
  }
}

export function GracePlaySurface({session, commit}: GracePlaySurfaceProps) {
  const [selectedActionId, setSelectedActionId] = useState<PlayActionId | null>(null);
  const [beat, setBeat] = useState<ConsequenceBeat | null>(null);
  const [worldBeat, setWorldBeat] = useState<WorldResponseBeat | null>(null);
  const [dismissedEncounter, setDismissedEncounter] = useState<{
    id: string;
    eventCount: number;
  } | null>(null);

  const replayed = useMemo(() => replaySession(session), [session]);
  const scene = useMemo(() => derivePlayScene(session), [session]);
  const actions = useMemo(() => derivePlayActions(session), [session]);
  const worldResponse = useMemo(() => deriveWorldResponseOffer(session), [session]);
  const encounter = useMemo(() => deriveEncounterOffer(session), [session]);
  const attendance = useMemo(() => deriveDayAttendance(session), [session]);
  const visibleEncounter =
    encounter &&
    !(
      dismissedEncounter?.id === encounter.id &&
      dismissedEncounter.eventCount === session.events.length
    )
      ? encounter
      : null;

  const previews = useMemo(
    () =>
      new Map(
        actions.map((action) => [
          action.id,
          previewPlayAction(session, action.id),
        ]),
      ),
    [actions, session],
  );

  const selected =
    selectedActionId === null
      ? null
      : actions.find((action) => action.id === selectedActionId) ?? null;
  const selectedPreview =
    selectedActionId === null ? null : previews.get(selectedActionId) ?? null;

  const perform = (actionId: PlayActionId) => {
    const action = actions.find((candidate) => candidate.id === actionId);
    if (!action) return;
    const resolved = resolvePlayAction(session, actionId);
    setBeat(resolved.beat);
    setSelectedActionId(null);
    setDismissedEncounter(null);
    commit(...action.events);
  };

  const respondToWorld = (disposition: WorldResponseDisposition) => {
    if (!worldResponse) return;
    resolveWorldResponse(session, worldResponse.id, disposition);
    setWorldBeat(beatForWorldResponse(disposition));
    setSelectedActionId(null);
    setDismissedEncounter(null);
    commit({
      type: 'world_response',
      responseId: worldResponse.id,
      disposition,
    });
  };

  if (beat) {
    return (
      <div
        className="min-h-[32rem] bg-gradient-to-b from-stone-950 via-stone-900 to-amber-950 px-5 py-8 text-stone-50 sm:px-8"
        aria-live="polite"
      >
        <div className="mx-auto flex min-h-[26rem] max-w-xl flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Receipt stamped
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{beat.title}</h2>
          <div className="mt-5 space-y-3 text-base leading-relaxed text-stone-200">
            {beat.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
            <p className="text-stone-300">
              Spent: {costText(beat.spent) || 'nothing declared'}
            </p>
            <p className="mt-2 text-stone-300">
              Closed for now:{' '}
              {beat.foreclosed.length > 0 ? beat.foreclosed.join(', ') : 'no previously available move'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setBeat(null)}
            className="mt-7 min-h-12 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-bold text-stone-950 transition hover:-translate-y-0.5 hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            Continue Tuesday
          </button>
        </div>
      </div>
    );
  }

  if (worldBeat) {
    return (
      <div
        className="min-h-[32rem] bg-gradient-to-b from-slate-950 via-blue-950 to-stone-950 px-5 py-8 text-white sm:px-8"
        aria-live="polite"
      >
        <div className="mx-auto flex min-h-[26rem] max-w-xl flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
            The world answered back
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{worldBeat.title}</h2>
          <div className="mt-5 space-y-3 text-base leading-relaxed text-white/80">
            {worldBeat.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setWorldBeat(null)}
            className="mt-7 min-h-12 rounded-2xl bg-cyan-200 px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-100"
          >
            Keep moving
          </button>
        </div>
      </div>
    );
  }

  if (worldResponse) {
    return (
      <div className="min-h-[32rem] bg-gradient-to-br from-sky-950 via-slate-950 to-stone-950 px-5 py-8 text-white sm:px-8">
        <div className="mx-auto flex min-h-[26rem] max-w-xl flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">
            Incoming world response
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{worldResponse.title}</h2>
          <p className="mt-5 text-base leading-relaxed text-white/80">{worldResponse.body}</p>

          <div className="mt-7 grid gap-3">
            {worldResponse.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => respondToWorld(option.id)}
                className="min-h-14 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="block text-sm font-bold text-white">{option.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-white/60">{option.note}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs leading-relaxed text-white/45">
            {worldResponse.nonClaims.join(' · ')}
          </p>
        </div>
      </div>
    );
  }

  if (visibleEncounter) {
    const isClown = visibleEncounter.kind === 'maddclown';
    return (
      <div
        className={
          isClown
            ? 'min-h-[32rem] bg-gradient-to-br from-fuchsia-950 via-stone-950 to-lime-950 px-5 py-8 text-white sm:px-8'
            : 'min-h-[32rem] bg-gradient-to-br from-indigo-950 via-slate-950 to-cyan-950 px-5 py-8 text-white sm:px-8'
        }
      >
        <div className="mx-auto flex min-h-[26rem] max-w-xl flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
            {isClown ? 'MADDcl0wn wildcard' : 'MADDJack encounter'}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{visibleEncounter.title}</h2>
          <p className="mt-5 text-base leading-relaxed text-white/80">{visibleEncounter.body}</p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setDismissedEncounter(null);
                commit(...visibleEncounter.events);
              }}
              className="min-h-12 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-stone-950 transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {visibleEncounter.acceptLabel}
            </button>
            <button
              type="button"
              onClick={() =>
                setDismissedEncounter({
                  id: visibleEncounter.id,
                  eventCount: session.events.length,
                })
              }
              className="min-h-12 rounded-2xl border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {visibleEncounter.dismissLabel}
            </button>
          </div>

          <p className="mt-5 text-xs leading-relaxed text-white/45">
            {visibleEncounter.nonClaims.join(' · ')}
          </p>
        </div>
      </div>
    );
  }

  if (attendance) {
    return (
      <div className="min-h-[32rem] bg-gradient-to-b from-indigo-950 via-stone-950 to-black px-5 py-8 text-stone-100 sm:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Tuesday · night
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{attendance.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            The day is over. The record is not a verdict.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Completed locally</h3>
              <div className="mt-3 space-y-2 text-sm text-stone-200">
                {attendance.completed.length > 0
                  ? attendance.completed.map((item) => <p key={item}>{item}</p>)
                  : <p>Nothing fully completed in this declared demand scope.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Still open</h3>
              <div className="mt-3 space-y-2 text-sm text-stone-200">
                {attendance.open.length > 0
                  ? attendance.open.map((item) => <p key={item}>{item}</p>)
                  : <p>No declared demand remains open.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Practiced</h3>
              <p className="mt-3 text-sm text-stone-200">
                {attendance.practiced.length > 0 ? attendance.practiced.join(' · ') : 'No culture trace advanced.'}
              </p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">What changed</h3>
              <div className="mt-3 space-y-2 text-sm text-stone-200">
                {attendance.changed.length > 0
                  ? attendance.changed.map((item) => <p key={item}>{item}</p>)
                  : <p>No additional declared change needs highlighting.</p>}
              </div>
            </section>
          </div>

          {attendance.strange.length > 0 && (
            <section className="mt-4 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/5 p-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-fuchsia-300">Strange things that came home too</h3>
              <div className="mt-3 space-y-2 text-sm text-stone-200">
                {attendance.strange.map((item) => <p key={item}>{item}</p>)}
              </div>
            </section>
          )}

          <p className="mt-6 text-xs leading-relaxed text-stone-500">
            {attendance.nonClaims.join(' · ')}
          </p>
        </div>
      </div>
    );
  }

  const projectionsHidden = replayed.story.projectionsHiddenTurns > 0;

  return (
    <div className="bg-gradient-to-b from-amber-50 via-orange-50/60 to-stone-50 px-4 py-6 sm:px-7 sm:py-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[2rem] border border-amber-200/80 bg-white/90 p-5 shadow-lg shadow-amber-950/5 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-800">
            {scene.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
            {scene.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-stone-650">
            {scene.body}
          </p>

          <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              One thing now
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-900">{scene.focus}</p>
          </div>

          {!projectionsHidden ? (
            <div className="mt-4 grid grid-cols-5 gap-1.5" aria-label="Current supply">
              {([
                ['time', scene.resources.time],
                ['cash', scene.resources.cash],
                ['food', scene.resources.food],
                ['trip', scene.resources.transport],
                ['attention', scene.resources.attention],
              ] as const).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-stone-950 px-1.5 py-2.5 text-center text-white">
                  <div className="text-base font-bold">{label === 'cash' ? '$' : ''}{value}</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-wide text-stone-400">{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-fuchsia-950 px-4 py-3 text-sm font-semibold text-fuchsia-100">
              Numeric projections are hidden. The underlying state is still there.
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">
            What do you put in your hand?
          </p>
          <div className="mt-2 grid gap-2.5">
            {actions.map((action) => {
              const preview = previews.get(action.id);
              const active = selectedActionId === action.id;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => setSelectedActionId(active ? null : action.id)}
                  aria-expanded={active}
                  className={
                    active
                      ? 'min-h-16 rounded-2xl border-2 border-amber-500 bg-white px-4 py-3 text-left shadow-md transition'
                      : 'min-h-16 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600'
                  }
                >
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-bold text-stone-950">{action.label}</span>
                      <span className="mt-1 block text-xs text-stone-500">
                        {preview ? costText(preview.cost) : ''}
                      </span>
                    </span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                      {action.tone}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selected && selectedPreview && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-700">
              Before you commit
            </p>
            <h3 className="mt-1 text-base font-bold text-stone-950">{selected.label}</h3>
            <p className="mt-2 text-sm text-stone-700">
              Spend {costText(selectedPreview.cost)}.
            </p>
            <p className="mt-2 text-sm text-stone-700">
              {selectedPreview.foreclosed.length > 0
                ? `This makes unavailable for now: ${selectedPreview.foreclosed.join(', ')}.`
                : 'No previously affordable move is foreclosed immediately.'}
            </p>
            <p className="mt-2 text-xs text-stone-500">
              This is mechanics visibility, not a recommendation.
            </p>
            <button
              type="button"
              onClick={() => perform(selected.id)}
              className="mt-4 min-h-12 w-full rounded-xl bg-stone-950 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            >
              Do it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
