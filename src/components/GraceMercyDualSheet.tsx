import React, { useEffect, useMemo, useState } from 'react';
import type { Profile } from '../types.js';
import { api } from '../lib/api.js';
import type { BrokenPromiseAction } from '../lib/graceMercy/brokenPromise.js';
import type { MercyEncounterProjection } from '../lib/graceMercy/types.js';
import type { MercyEncounterReceipt } from '../lib/graceMercy/receipt.js';

interface Props { currentUser: Profile | null; }
interface EncounterResponse { projection: MercyEncounterProjection; receipt: MercyEncounterReceipt | null; }

const ACTION_LABELS: Partial<Record<BrokenPromiseAction, string>> = {
  NOTICE_RUPTURE: 'Review what happened',
  NAME_OCCURRENCE: 'Name the occurrence',
  TEST_PATTERN: 'Test the pattern',
  WITNESS_CONSEQUENCE: 'Witness the consequence',
  BOUND_COMMITMENT: 'Set the boundary',
  TURN_TO_GRACE: 'Turn toward Grace',
  CLOSE_ENCOUNTER: 'Close encounter',
};

function nextMercyAction(projection: MercyEncounterProjection): BrokenPromiseAction | null {
  if (projection.currentSheet !== 'MERCY' || projection.closed) return null;
  const types = new Set(projection.eventHistory.map((event) => event.eventType));
  if (!types.has('mercy.occurrence_named')) return 'NAME_OCCURRENCE';
  if (!types.has('mercy.pattern_tested')) return 'TEST_PATTERN';
  if (!types.has('mercy.consequence_witnessed')) return 'WITNESS_CONSEQUENCE';
  if (!types.has('mercy.boundary_set')) return 'BOUND_COMMITMENT';
  return null;
}

export const GraceMercyDualSheet: React.FC<Props> = ({ currentUser }) => {
  const [encounter, setEncounter] = useState<EncounterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      setEncounter(await api.getGraceMercyEncounter(currentUser.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the dual sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [currentUser?.id]);

  const act = async (action: BrokenPromiseAction) => {
    if (!currentUser || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await api.postGraceMercyAction(currentUser.id, action, crypto.randomUUID());
      setEncounter({ projection: response.projection, receipt: response.receipt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The sheet could not turn.');
    } finally {
      setBusy(false);
    }
  };

  const groupedFacts = useMemo(() => {
    const facts = encounter?.projection.evidenceStates ?? [];
    return {
      KNOWN: facts.filter((fact) => fact.state === 'KNOWN'),
      CONTESTED: facts.filter((fact) => fact.state === 'CONTESTED'),
      UNKNOWN: facts.filter((fact) => fact.state === 'UNKNOWN'),
    };
  }, [encounter]);

  if (!currentUser) return null;
  if (loading && !encounter) {
    return <section className="parchment-card rounded-3xl p-5 text-xs text-stone-500">Reading the other side of the sheet...</section>;
  }
  if (!encounter) {
    return <section className="parchment-card rounded-3xl p-5"><p className="text-xs text-rose-800">{error || 'Dual sheet unavailable.'}</p></section>;
  }

  const { projection, receipt } = encounter;
  const mercyNext = nextMercyAction(projection);
  const activeBoundary = projection.activeBoundaries.at(-1) ?? null;
  const initials = currentUser.displayName.substring(0, 2).toUpperCase();

  return (
    <section className={`rounded-3xl border p-5 sm:p-6 space-y-5 transition-colors ${projection.currentSheet === 'MERCY' ? 'bg-stone-100 border-stone-400' : 'parchment-card-warm border-[#e2d7c7]'}`}>
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-amber-900">FICTIONAL FIXTURE · BROKEN PROMISE 001</p>
        <p className="text-[11px] text-stone-700 mt-1">This prototype uses a fixed scenario to exercise the dual sheet. It is not evaluating your relationships or inferring a real rupture.</p>
      </div>

      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${currentUser.avatarColor || 'bg-amber-800 text-amber-50'}`}>{initials}</div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500">One character · two lawful postures</p>
            <h3 className="font-serif-warm text-2xl font-bold text-[#1c1917] truncate">{currentUser.displayName}</h3>
          </div>
        </div>
        <span className="rounded-full border border-stone-400 px-3 py-1 text-[10px] font-bold tracking-[0.18em]">{projection.currentSheet}</span>
      </header>

      {projection.currentSheet === 'GRACE' ? (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-emerald-800">GRACE</p>
            <p className="font-serif-warm text-xl font-bold mt-1">What good can live here?</p>
            <p className="text-xs text-stone-600 mt-2">Current objective: <strong>{projection.objective}</strong></p>
          </div>
          {activeBoundary && <div className="rounded-2xl border border-stone-400 bg-white/70 p-3"><p className="text-[10px] uppercase tracking-wider font-bold text-stone-700">Boundary still active</p><p className="text-xs text-stone-700 mt-1 font-mono">{activeBoundary}</p></div>}
          {!projection.mercyAvailable && !projection.closed && <button disabled={busy} onClick={() => void act('NOTICE_RUPTURE')} className="rounded-2xl bg-emerald-800 text-white px-4 py-3 text-xs font-bold disabled:opacity-50">{ACTION_LABELS.NOTICE_RUPTURE}</button>}
          {projection.mercyAvailable && !projection.discernment && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-900">MERCY AVAILABLE</p>
              <p className="text-xs text-stone-700">Rupture can be examined without deciding motive.</p>
              <button disabled={busy} onClick={() => void act('TURN_TO_MERCY')} className="rounded-xl bg-stone-900 text-white px-4 py-2.5 text-xs font-bold disabled:opacity-50">TURN THE SHEET</button>
            </div>
          )}
          {projection.discernment && !projection.closed && <button disabled={busy} onClick={() => void act('CLOSE_ENCOUNTER')} className="rounded-xl border border-stone-400 bg-white px-4 py-2.5 text-xs font-bold disabled:opacity-50">Close encounter</button>}
        </div>
      ) : (
        <div className="space-y-5">
          <div><p className="text-[10px] uppercase tracking-[0.18em] font-bold text-stone-800">MERCY</p><p className="font-serif-warm text-xl font-bold mt-1">What actually happened, what must remain protected, and what lawful relationship is still possible now?</p></div>
          <div className="grid sm:grid-cols-3 gap-2">
            {(['KNOWN','CONTESTED','UNKNOWN'] as const).map((state) => (
              <div key={state} className="rounded-2xl border border-stone-300 bg-white/75 p-3">
                <p className="text-[9px] uppercase tracking-wider font-bold text-stone-500">{state}</p>
                <ul className="mt-2 space-y-1.5">{groupedFacts[state].map((fact) => <li key={fact.key} className="text-[11px] text-stone-700">{fact.summary}</li>)}</ul>
              </div>
            ))}
          </div>
          {activeBoundary && <div className="rounded-2xl border border-stone-500 bg-white p-3"><p className="text-[10px] uppercase tracking-wider font-bold">Boundary</p><p className="text-xs font-mono mt-1">{activeBoundary}</p></div>}
          {mercyNext && <button disabled={busy} onClick={() => void act(mercyNext)} className="rounded-xl bg-stone-900 text-white px-4 py-2.5 text-xs font-bold disabled:opacity-50">{ACTION_LABELS[mercyNext] || mercyNext}</button>}
          {!mercyNext && !projection.discernment && !projection.closed && (
            <div className="grid grid-cols-3 gap-2">
              <button disabled={busy} onClick={() => void act('DISCERN_Y')} className="rounded-xl border border-emerald-700 bg-emerald-50 px-3 py-2.5 text-xs font-bold">Y</button>
              <button disabled={busy} onClick={() => void act('DISCERN_HOLD')} className="rounded-xl border border-amber-700 bg-amber-50 px-3 py-2.5 text-xs font-bold">HOLD</button>
              <button disabled={busy} onClick={() => void act('DISCERN_REFUSE')} className="rounded-xl border border-stone-700 bg-white px-3 py-2.5 text-xs font-bold">REFUSE</button>
            </div>
          )}
          {projection.discernment && !projection.closed && (
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => void act('TURN_TO_GRACE')} className="rounded-xl border border-emerald-700 bg-emerald-50 px-3 py-2.5 text-xs font-bold">Turn toward Grace</button>
              <button disabled={busy} onClick={() => void act('CLOSE_ENCOUNTER')} className="rounded-xl bg-stone-900 text-white px-3 py-2.5 text-xs font-bold">Close encounter</button>
            </div>
          )}
        </div>
      )}

      {receipt && (
        <div className="border-t border-stone-300 pt-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider font-bold text-stone-600">Mercy receipt · {receipt.discernment} · {receipt.disposition}</p>
          <p className="text-[10px] font-mono text-stone-500 break-all">{receipt.receiptHash}</p>
          <p className="text-[10px] text-stone-500">The receipt preserves the occurrence and boundary. It does not establish motive, diagnosis, moral worth, divine interpretation, restored relationship, or removed consequence.</p>
        </div>
      )}
      {error && <p className="text-xs text-rose-800">{error}</p>}
    </section>
  );
};
