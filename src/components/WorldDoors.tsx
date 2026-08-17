import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DoorOpen, Fingerprint, RefreshCw, Route, ShieldCheck, X } from 'lucide-react';

import { ApiError, api, type WorldDecodeResult, type WorldFieldResponse } from '../lib/api.js';
import type { ConfirmCrossingResult } from '../world-runtime/contracts.js';

type Point = { x: number; y: number };

type DisplayFailure = {
  label: 'FAILED';
  detail: string;
};

const DOOR_POSITIONS: Record<string, { left: string; top: string }> = {
  'door:corpus': { left: '88%', top: '50%' },
  'door:upper-room': { left: '50%', top: '10%' },
  'door:band-runtime': { left: '50%', top: '90%' },
};

const DOOR_NAMES: Record<string, string> = {
  'door:corpus': 'Corpus OS',
  'door:upper-room': 'Upper Room',
  'door:band-runtime': 'Band Runtime',
};

const UNAVAILABLE_COPY: Record<string, string> = {
  BOOT_HOUSE_DONOR_PATHS_REQUIRED: 'Donor repository paths are not configured on this host.',
  BOOT_HOUSE_DONOR_WORKSPACE_MISSING: 'One configured donor path is not a repository workspace.',
  BOOT_HOUSE_PINNED_SOURCE_REQUIRED: 'A pinned Full Measure source commit is required before crossing.',
};

function normalizePoint(event: React.PointerEvent<HTMLDivElement>, element: HTMLDivElement): Point {
  const rect = element.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1)));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(rect.height, 1)));
  return {
    x: Math.round(x * 1_000_000),
    y: Math.round(y * 1_000_000),
  };
}

function resultLabel(result: ConfirmCrossingResult | null): string | null {
  if (!result) return null;
  if (result.kind === 'validation-failed') return 'VALIDATION FAILED';
  if (result.kind === 'declined') return 'DECLINED';
  return result.residue.destinationStatus.toUpperCase();
}

export default function WorldDoors() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [fieldResponse, setFieldResponse] = useState<WorldFieldResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [decoded, setDecoded] = useState<WorldDecodeResult | null>(null);
  const [selectedDoorRef, setSelectedDoorRef] = useState<string | null>(null);
  const [result, setResult] = useState<ConfirmCrossingResult | null>(null);
  const [failure, setFailure] = useState<DisplayFailure | null>(null);
  const [busy, setBusy] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  const refreshField = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getWorldField();
      setFieldResponse(response);
    } catch (error) {
      setFailure({ label: 'FAILED', detail: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshField();
  }, [refreshField]);

  const resetGesture = () => {
    setPoints([]);
    setDecoded(null);
    setSelectedDoorRef(null);
    setResult(null);
    setFailure(null);
    setShowEvidence(false);
  };

  const decodePoints = async (nextPoints: Point[]) => {
    if (!fieldResponse?.available || nextPoints.length < 2) return;
    setBusy(true);
    setDecoded(null);
    setResult(null);
    setFailure(null);
    try {
      const response = await api.decodeWorldStroke(nextPoints);
      setDecoded(response);
      setSelectedDoorRef(response.decoding.ambiguity.leadingDoorRefs[0] ?? null);
    } catch (error) {
      if (error instanceof ApiError) {
        const body = typeof error.body === 'object' && error.body !== null
          ? error.body as Record<string, unknown>
          : {};
        setFailure({
          label: 'FAILED',
          detail: typeof body.failureClass === 'string' ? body.failureClass : error.message,
        });
      } else {
        setFailure({ label: 'FAILED', detail: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      setBusy(false);
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!fieldResponse?.available || busy || !surfaceRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = normalizePoint(event, surfaceRef.current);
    setDrawing(true);
    setPoints([point]);
    setDecoded(null);
    setSelectedDoorRef(null);
    setResult(null);
    setFailure(null);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing || !surfaceRef.current) return;
    const point = normalizePoint(event, surfaceRef.current);
    setPoints((current) => {
      const previous = current[current.length - 1];
      if (previous && Math.abs(previous.x - point.x) + Math.abs(previous.y - point.y) < 8_000) {
        return current;
      }
      return current.length >= 512 ? current : [...current, point];
    });
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawing || !surfaceRef.current) return;
    setDrawing(false);
    const finalPoint = normalizePoint(event, surfaceRef.current);
    setPoints((current) => {
      const next = current.length < 512 ? [...current, finalPoint] : current;
      void decodePoints(next);
      return next;
    });
  };

  const crossDoor = async () => {
    if (!decoded || !selectedDoorRef || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const crossing = await api.crossWorldDoor(decoded.pendingId, selectedDoorRef);
      setResult(crossing);
      if (crossing.kind === 'terminal') {
        await refreshField();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const body = typeof error.body === 'object' && error.body !== null
          ? error.body as Record<string, unknown>
          : {};
        setFailure({
          label: 'FAILED',
          detail: typeof body.failureClass === 'string'
            ? body.failureClass
            : typeof body.reasonCode === 'string'
              ? body.reasonCode
              : error.message,
        });
      } else {
        setFailure({ label: 'FAILED', detail: error instanceof Error ? error.message : String(error) });
      }
    } finally {
      setBusy(false);
    }
  };

  const polyline = useMemo(
    () => points.map((point) => `${point.x},${point.y}`).join(' '),
    [points]
  );

  const visibleEvidence = result?.kind === 'terminal'
    ? result.residue.evidenceRefs
    : result?.kind === 'validation-failed'
      ? result.evidenceRefs
      : [];

  if (loading && !fieldResponse) {
    return (
      <section className="mb-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-stone-500"><RefreshCw size={18} className="animate-spin" /> Reading the threshold…</div>
      </section>
    );
  }

  const available = fieldResponse?.available === true;

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <div className="border-b border-stone-100 bg-stone-950 px-6 py-5 text-stone-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-amber-300">
              <DoorOpen size={14} /> The House · World Encounter v0.1
            </div>
            <h2 className="mt-2 text-2xl font-semibold">Draw toward a door.</h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-300">
              Gesture is only intent. The crossing still requires a separate human confirmation, and every destination decides locally.
            </p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-bold ${available ? 'bg-emerald-300 text-emerald-950' : 'bg-stone-700 text-stone-200'}`}>
            {available ? 'LIVE CROSSING' : 'THRESHOLD ONLY'}
          </div>
        </div>
      </div>

      {!available ? (
        <div className="p-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="font-semibold">The field can be seen, but this host cannot cross it yet.</div>
            <div className="mt-1 text-amber-800">
              {UNAVAILABLE_COPY[fieldResponse?.reasonCode ?? ''] ?? fieldResponse?.reasonCode ?? 'World runtime unavailable.'}
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {fieldResponse?.field.doors.map((door) => (
              <div key={door.doorRef} className="rounded-2xl border border-stone-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-stone-900">{DOOR_NAMES[door.doorRef] ?? door.doorRef}</div>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">FIXTURE</span>
                </div>
                <div className="mt-2 text-xs text-stone-500">{door.relation}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 md:p-6">
          <div
            ref={surfaceRef}
            className="relative h-[320px] touch-none select-none overflow-hidden rounded-3xl border border-stone-300 bg-[radial-gradient(circle_at_center,_#fafaf9_0,_#f5f5f4_50%,_#e7e5e4_100%)]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrawing(false)}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000000 1000000" preserveAspectRatio="none">
              <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="9000" strokeLinecap="round" strokeLinejoin="round" className="text-stone-700/70" />
            </svg>

            <div className="pointer-events-none absolute left-[10%] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-stone-500 bg-white px-3 py-2 text-xs font-bold text-stone-700 shadow-sm">
              GARDEN
            </div>

            {fieldResponse.field.doors.map((door) => {
              const position = DOOR_POSITIONS[door.doorRef] ?? { left: '50%', top: '50%' };
              const leading = decoded?.decoding.ambiguity.leadingDoorRefs.includes(door.doorRef) ?? false;
              return (
                <div
                  key={door.doorRef}
                  className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-3 py-2 text-center shadow-sm transition ${leading ? 'border-amber-400 bg-amber-100 ring-4 ring-amber-200/60' : 'border-stone-300 bg-white/90'}`}
                  style={position}
                >
                  <div className="text-[11px] font-bold text-stone-900">{DOOR_NAMES[door.doorRef] ?? door.doorRef}</div>
                  <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700">{door.evidenceMode}</div>
                </div>
              );
            })}

            {!drawing && points.length === 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-xs font-medium text-stone-500">
                drag from the Garden toward a door
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="flex items-center gap-1"><Fingerprint size={13} /> raw stroke retained</span>
            <span>·</span>
            <span className="flex items-center gap-1"><ShieldCheck size={13} /> authority: none</span>
            <span>·</span>
            <span>three fixture-backed doors</span>
          </div>

          {busy && <div className="mt-4 text-sm text-stone-500">The threshold is evaluating the declared step…</div>}

          {decoded && !result && !failure && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-950"><Route size={16} /> TranchNode decoded a candidate traversal.</div>
              <div className="mt-2 text-xs text-amber-800">
                {decoded.decoding.ambiguity.kind === 'collision'
                  ? 'Collision preserved: choose one of the tied leading doors.'
                  : `Leading door: ${DOOR_NAMES[decoded.decoding.ambiguity.leadingDoorRefs[0] ?? ''] ?? decoded.decoding.ambiguity.leadingDoorRefs[0]}`}
              </div>
              {decoded.decoding.ambiguity.kind === 'collision' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {decoded.decoding.ambiguity.leadingDoorRefs.map((doorRef) => (
                    <button
                      key={doorRef}
                      type="button"
                      onClick={() => setSelectedDoorRef(doorRef)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selectedDoorRef === doorRef ? 'border-stone-900 bg-stone-900 text-white' : 'border-amber-300 bg-white text-stone-800'}`}
                    >
                      {DOOR_NAMES[doorRef] ?? doorRef}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                disabled={!selectedDoorRef || busy}
                onClick={() => void crossDoor()}
                className="mt-4 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cross this door
              </button>
              <div className="mt-2 text-[11px] text-amber-700">This confirmation is distinct from the gesture and is consumed once.</div>
            </div>
          )}

          {(result || failure) && (
            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Destination result</div>
                  <div className="mt-1 text-xl font-black text-stone-950">{failure?.label ?? resultLabel(result)}</div>
                </div>
                <button type="button" onClick={resetGesture} className="flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700">
                  <X size={13} /> Clear
                </button>
              </div>

              {failure && <div className="mt-3 text-sm text-rose-700">{failure.detail}</div>}
              {result?.kind === 'validation-failed' && <div className="mt-3 text-sm text-rose-700">{result.reasonCode}</div>}
              {result?.kind === 'terminal' && (
                <div className="mt-3 text-sm text-stone-700">
                  World projection: <strong>{result.worldChange.kind}</strong>. Residue remains non-authoritative.
                </div>
              )}

              {visibleEvidence.length > 0 && (
                <div className="mt-4">
                  <button type="button" onClick={() => setShowEvidence((value) => !value)} className="text-xs font-semibold text-stone-700 underline underline-offset-4">
                    {showEvidence ? 'Hide evidence' : 'Inspect evidence chain'}
                  </button>
                  {showEvidence && (
                    <div className="mt-3 max-h-44 overflow-auto rounded-xl bg-stone-950 p-3 font-mono text-[10px] leading-relaxed text-stone-200">
                      {visibleEvidence.map((ref) => <div key={ref} className="break-all">{ref}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button type="button" onClick={() => void refreshField()} className="flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900">
              <RefreshCw size={13} /> Refresh field
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
