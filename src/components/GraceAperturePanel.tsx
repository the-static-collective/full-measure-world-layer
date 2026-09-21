import React, {useMemo, useState} from 'react';

import {
  partyMembers,
  possibleWorldPrinciples,
  type PartyMemberId,
} from '../../specimens/grace-001/apertures.ts';
import {
  replaySession,
  type GraceSession,
  type GraceSessionInputEvent,
} from '../../specimens/grace-001/session.ts';

interface GraceAperturePanelProps {
  session: GraceSession;
  commit: (...events: GraceSessionInputEvent[]) => void;
}

function eventLabel(event: GraceSession['events'][number]): string {
  switch (event.type) {
    case 'focus':
      return `${event.id} · focus → ${event.threadId}`;
    case 'story_card':
      return `${event.id} · card → ${event.cardId}`;
    case 'economy_action':
      return `${event.id} · action → ${event.actionId}`;
    case 'dm_roll':
      return `${event.id} · pressure proposal`;
    case 'dream_red_door':
      return `${event.id} · Red Door dream`;
    case 'upper_room_return':
      return `${event.id} · Upper Room return`;
    case 'remembered_word':
      return `${event.id} · remembered card`;
    case 'seed_card_envelope':
      return `${event.id} · inherited card lineage`;
    case 'choose_party':
      return `${event.id} · party changed`;
    case 'flashback_reflection':
      return `${event.id} · flashback reflection`;
    case 'possible_world_toggle':
      return `${event.id} · possible-world principle`;
    case 'possible_world_return':
      return `${event.id} · possible-world return`;
  }
}

export function GraceAperturePanel({
  session,
  commit,
}: GraceAperturePanelProps) {
  const replayed = useMemo(() => replaySession(session), [session]);
  const {apertures} = replayed;
  const [reflection, setReflection] = useState('');
  const [sourceEventId, setSourceEventId] = useState('');

  const flashbackCandidates = useMemo(
    () =>
      session.events.filter(
        (event) =>
          event.type !== 'choose_party' &&
          event.type !== 'flashback_reflection' &&
          event.type !== 'possible_world_toggle' &&
          event.type !== 'possible_world_return',
      ),
    [session],
  );

  const activeSource =
    sourceEventId || flashbackCandidates.at(-1)?.id || '';

  const toggleCompanion = (member: PartyMemberId) => {
    if (member === 'grace') return;
    const selected = new Set(apertures.party);
    if (selected.has(member)) selected.delete(member);
    else selected.add(member);
    commit({type: 'choose_party', members: [...selected]});
  };

  const recordReflection = () => {
    if (!activeSource || !reflection.trim()) return;
    commit(
      {type: 'economy_action', actionId: 'reflection-block'},
      {
        type: 'flashback_reflection',
        sourceEventId: activeSource,
        presentReflection: reflection.trim(),
      },
    );
  };

  const returnFromPossibleWorld = () => {
    commit(
      {type: 'economy_action', actionId: 'worldbuilding-block'},
      {type: 'possible_world_return'},
    );
  };

  const latestFlashback = apertures.flashbacks.at(-1);
  const latestPossibleReturn = apertures.possibleWorldReturns.at(-1);

  return (
    <div className="border-t border-amber-100 bg-stone-50/70 px-5 py-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          World apertures · party / memory / possibility
        </p>
        <p className="mt-1 max-w-3xl text-sm text-stone-600">
          The party changes the questions available to the scene. Flashbacks may change present interpretation, never historical events.
          Possible worlds may reveal design tensions, never create present supply.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-rose-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Choose your party</p>
          <div className="mt-3 space-y-2">
            {(Object.keys(partyMembers) as PartyMemberId[]).map((id) => {
              const member = partyMembers[id];
              const selected = apertures.party.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleCompanion(id)}
                  disabled={id === 'grace'}
                  className={
                    selected
                      ? 'w-full rounded-xl border border-rose-300 bg-rose-50 px-3 py-3 text-left'
                      : 'w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-left'
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-stone-900">{member.label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-stone-500">
                      {selected ? 'in party' : 'available'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-600">{member.lenses.join(' · ')}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Companions add lenses and prompts, not fungible worker units or stat bonuses.
          </p>
        </section>

        <section className="rounded-2xl border border-sky-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Flashback aperture</p>
          {flashbackCandidates.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600">Live one attributable event first. Then you can return to it.</p>
          ) : (
            <>
              <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                Earlier event
              </label>
              <select
                value={activeSource}
                onChange={(event) => setSourceEventId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800"
              >
                {flashbackCandidates.map((event) => (
                  <option key={event.id} value={event.id}>
                    {eventLabel(event)}
                  </option>
                ))}
              </select>
              <textarea
                value={reflection}
                onChange={(event) => setReflection(event.target.value)}
                placeholder="What do you notice now that you could not say then?"
                className="mt-3 min-h-24 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800"
              />
              <button
                onClick={recordReflection}
                disabled={!reflection.trim()}
                className="mt-2 rounded-full bg-sky-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Spend 1 time + 1 attention to reflect
              </button>
            </>
          )}

          {latestFlashback && (
            <div className="mt-4 rounded-xl bg-sky-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                Return witness · {latestFlashback.sourceEventId}
              </p>
              <p className="mt-1 text-xs text-sky-950">{latestFlashback.presentReflection}</p>
              <p className="mt-2 text-[10px] text-sky-700">The source event remains unchanged.</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Grace&apos;s Possible House
          </p>
          <p className="mt-1 text-xs text-stone-600">
            Build the fantasy hard enough that its inputs and tensions become visible.
          </p>

          <div className="mt-3 space-y-2">
            {possibleWorldPrinciples.map((principle) => {
              const selected = apertures.possibleWorldSelection.includes(principle.id);
              return (
                <button
                  key={principle.id}
                  onClick={() => commit({type: 'possible_world_toggle', principleId: principle.id})}
                  className={
                    selected
                      ? 'w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-left'
                      : 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-left'
                  }
                >
                  <span className="block text-xs font-semibold text-stone-900">{principle.label}</span>
                  <span className="mt-1 block text-[10px] text-stone-500">{principle.asks}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={returnFromPossibleWorld}
            className="mt-3 rounded-full bg-emerald-900 px-4 py-2 text-xs font-semibold text-white"
          >
            Spend 1 time + 1 attention · return with witness
          </button>

          {latestPossibleReturn && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Possible-world return
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-950">Tensions retained</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-emerald-900">
                {latestPossibleReturn.tensions.map((tension) => (
                  <li key={tension}>{tension}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-semibold text-emerald-950">Party questions</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-emerald-900">
                {latestPossibleReturn.prompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
