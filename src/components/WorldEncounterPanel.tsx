import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  DoorOpen,
  Fingerprint,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

import { worldRuntimeClient } from '../lib/worldRuntime/client';
import {
  buildGardenEncounterEnvelope,
  createGardenCrossingRefs,
} from '../lib/worldRuntime/gardenEncounter';
import { selectGardenTraversalCandidate } from '../lib/worldRuntime/gardenSelection';
import {
  GARDEN_DECODER,
  GARDEN_HEIGHT,
  GARDEN_LAYOUT,
  GARDEN_TEMPLATES,
  GARDEN_WIDTH,
  normalizePointerStroke,
  type RawPointerPoint,
} from '../lib/worldRuntime/gardenTraversal';
import type {
  WorldDoorProjection,
  WorldEncounterResidue,
  WorldFieldProjection,
} from '../lib/worldRuntime/types';

type Availability = {
  tranchnode: boolean;
  project0: boolean;
  corpusOs: boolean;
};

type Decoding = {
  authority: 'none';
  strokeHash: string;
  fieldLayoutRef: string;
  fingerprint: string;
  candidates: Array<{
    templateId: string;
    totalCost: number;
  }>;
  ambiguity: {
    kind: 'none' | 'collision';
    leadingTemplateIds: string[];
  };
};

type AdapterBody<T> =
  | { ok: true; value: T }
  | { ok: false; kind?: string; code?: string; donor?: string };

type PreparedEncounter = {
  operation: 'address';
  record: {
    ref: string;
    body: unknown;
  };
};

type CrossingOutcome = {
  status: 'validation-failed' | 'admitted' | 'refused' | 'indeterminate' | 'failed';
  destinationInvoked: boolean;
  residue: WorldEncounterResidue;
};

const EMPTY_AVAILABILITY: Availability = {
  tranchnode: false,
  project0: false,
  corpusOs: false,
};

const MAX_BROWSER_STROKE_POINTS = 128;
const MIN_SAMPLE_DISTANCE = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readableFailure(value: unknown, fallback: string): string {
  if (!isRecord(value)) return fallback;
  if (typeof value.error === 'string') return value.error;
  if (typeof value.code === 'string') return value.code;
  if (typeof value.donor === 'string') return `${value.donor} unavailable`;
  if (typeof value.kind === 'string') return value.kind;
  return fallback;
}

function doorTitle(door: WorldDoorProjection): string {
  switch (door.doorRef) {
    case 'world-door:corpus-casework-v0.1':
      return 'Corpus OS · Casework';
    case 'world-door:band-runtime-fixture-v0.1':
      return 'Band Runtime · Groove Room';
    case 'world-door:upper-room-fixture-v0.1':
      return 'Upper Room · Scripture Room';
    default:
      return door.destinationRef;
  }
}

function statusClasses(status: CrossingOutcome['status']): string {
  switch (status) {
    case 'admitted':
      return 'border-emerald-300 bg-emerald-50 text-emerald-950';
    case 'refused':
      return 'border-amber-300 bg-amber-50 text-amber-950';
    case 'indeterminate':
      return 'border-sky-300 bg-sky-50 text-sky-950';
    case 'validation-failed':
      return 'border-rose-300 bg-rose-50 text-rose-950';
    case 'failed':
      return 'border-stone-400 bg-stone-100 text-stone-950';
  }
}

function pointerToField(event: React.PointerEvent<SVGSVGElement>): RawPointerPoint {
  const rect = event.currentTarget.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  return {
    x: ((event.clientX - rect.left) / width) * GARDEN_WIDTH,
    y: ((event.clientY - rect.top) / height) * GARDEN_HEIGHT,
  };
}

function shouldAppendPoint(points: RawPointerPoint[], next: RawPointerPoint): boolean {
  if (points.length === 0) return true;
  if (points.length >= MAX_BROWSER_STROKE_POINTS) return false;
  const previous = points[points.length - 1]!;
  const dx = next.x - previous.x;
  const dy = next.y - previous.y;
  return Math.hypot(dx, dy) >= MIN_SAMPLE_DISTANCE;
}

export function WorldEncounterPanel() {
  const [field, setField] = useState<WorldFieldProjection | null>(null);
  const [doors, setDoors] = useState<WorldDoorProjection[]>([]);
  const [availability, setAvailability] = useState<Availability>(EMPTY_AVAILABILITY);
  const [rawPoints, setRawPoints] = useState<RawPointerPoint[]>([]);
  const [decoding, setDecoding] = useState<Decoding | null>(null);
  const [outcome, setOutcome] = useState<CrossingOutcome | null>(null);
  const [testimony, setTestimony] = useState('Human-confirmed Garden crossing witness.');
  const [loadingField, setLoadingField] = useState(true);
  const [decodingStroke, setDecodingStroke] = useState(false);
  const [crossing, setCrossing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const drawingRef = useRef(false);
  const strokeRef = useRef<RawPointerPoint[]>([]);
  const crossingSequenceRef = useRef(0);
  const sessionRef = useRef(
    `garden-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
  );

  const selection = useMemo(
    () => (decoding ? selectGardenTraversalCandidate(decoding, doors) : null),
    [decoding, doors],
  );

  const selectedDoor = useMemo(() => {
    if (!selection || selection.state !== 'candidate') return null;
    return doors.find((door) => door.doorRef === selection.doorRef) ?? null;
  }, [doors, selection]);

  const liveCrossingAvailable =
    availability.tranchnode && availability.project0 && availability.corpusOs;
  const canConfirmCrossing = Boolean(
    selection?.state === 'candidate' &&
      selection.canConfirmCrossing &&
      selectedDoor &&
      liveCrossingAvailable &&
      !crossing,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingField(true);
      const [fieldResult, doorsResult] = await Promise.all([
        worldRuntimeClient.getField<{
          field: WorldFieldProjection;
          availability: Availability;
        }>(),
        worldRuntimeClient.getDoors<{
          doors: WorldDoorProjection[];
          availability: Availability;
        }>(),
      ]);
      if (cancelled) return;

      if (fieldResult.ok) {
        setField(fieldResult.body.field);
        setAvailability(fieldResult.body.availability);
      } else {
        setMessage(readableFailure(fieldResult.body, 'World field unavailable'));
      }
      if (doorsResult.ok) {
        setDoors(doorsResult.body.doors);
        setAvailability(doorsResult.body.availability);
      } else {
        setMessage(readableFailure(doorsResult.body, 'World doors unavailable'));
      }
      setLoadingField(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const resetStroke = () => {
    drawingRef.current = false;
    strokeRef.current = [];
    setRawPoints([]);
    setDecoding(null);
    setOutcome(null);
    setMessage(null);
  };

  const decodeWitness = async (points: RawPointerPoint[]) => {
    const normalized = normalizePointerStroke(points);
    if (normalized.length < 2) {
      setMessage('Draw a longer stroke. A traversal witness needs at least two points.');
      return;
    }

    setDecodingStroke(true);
    setMessage(null);
    setOutcome(null);
    const response = await worldRuntimeClient.decodeStroke<AdapterBody<Decoding>>({
      points: normalized,
      layout: GARDEN_LAYOUT,
      templates: GARDEN_TEMPLATES,
      decoder: GARDEN_DECODER,
    });
    setDecodingStroke(false);

    if (!response.ok) {
      setDecoding(null);
      setMessage(readableFailure(response.body, 'Traversal decoder unavailable'));
      return;
    }
    if (!response.body.ok) {
      setDecoding(null);
      setMessage(readableFailure(response.body, 'Traversal decoder refused the witness'));
      return;
    }
    setDecoding(response.body.value);
  };

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const first = pointerToField(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokeRef.current = [first];
    setRawPoints([first]);
    setDecoding(null);
    setOutcome(null);
    setMessage(null);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;
    const next = pointerToField(event);
    if (!shouldAppendPoint(strokeRef.current, next)) return;
    strokeRef.current = [...strokeRef.current, next];
    setRawPoints(strokeRef.current);
  };

  const finishPointer = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const last = pointerToField(event);
    if (shouldAppendPoint(strokeRef.current, last)) {
      strokeRef.current = [...strokeRef.current, last];
      setRawPoints(strokeRef.current);
    }
    void decodeWitness(strokeRef.current);
  };

  const confirmCrossing = async () => {
    if (!field || !decoding || !selectedDoor || !canConfirmCrossing) return;

    crossingSequenceRef.current += 1;
    const refs = createGardenCrossingRefs(
      sessionRef.current,
      crossingSequenceRef.current,
    );
    const envelope = buildGardenEncounterEnvelope({
      testimonyRef: refs.testimonyRef,
      confirmationReceiptRef: refs.confirmationReceiptRef,
      fieldRef: field.fieldRef,
      door: selectedDoor,
      traversalFingerprint: decoding.fingerprint,
    });

    setCrossing(true);
    setMessage(null);
    setOutcome(null);

    const prepared = await worldRuntimeClient.prepareEncounter<AdapterBody<PreparedEncounter>>(envelope);
    if (!prepared.ok) {
      setCrossing(false);
      setMessage(readableFailure(prepared.body, 'Project0 encounter preparation unavailable'));
      return;
    }
    if (!prepared.body.ok) {
      setCrossing(false);
      setMessage(readableFailure(prepared.body, 'Project0 did not address this testimony'));
      return;
    }

    const traversalEvidenceRefs = [
      decoding.fingerprint,
      decoding.strokeHash,
      decoding.fieldLayoutRef,
    ].filter((value): value is string => typeof value === 'string' && value.length > 0);

    const confirmed = await worldRuntimeClient.confirmEncounter<AdapterBody<CrossingOutcome>>({
      sourceFieldRef: field.fieldRef,
      doorRef: selectedDoor.doorRef,
      crossingRef: refs.crossingRef,
      confirmationReceiptRef: refs.confirmationReceiptRef,
      traversalEvidenceRefs,
      encounterRef: prepared.body.value.record.ref,
      encounterBody: prepared.body.value.record.body,
      destinationSubjectRef: 'artifact:agreement-a',
      input: testimony.trim() || 'Human-confirmed Garden crossing witness.',
    });
    setCrossing(false);

    if (!confirmed.ok) {
      setMessage(readableFailure(confirmed.body, 'Destination encounter unavailable'));
      return;
    }
    if (!confirmed.body.ok) {
      setMessage(readableFailure(confirmed.body, 'Encounter orchestration did not complete'));
      return;
    }
    setOutcome(confirmed.body.value);
  };

  const polyline = rawPoints.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <section className="mb-8 overflow-hidden rounded-3xl border border-stone-300 bg-white shadow-sm">
      <div className="border-b border-stone-200 bg-stone-950 px-5 py-5 text-stone-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              <span>World Threshold</span>
              <span className="rounded-full border border-amber-200/40 px-2 py-0.5 normal-case tracking-normal">
                Prototype · fixture doors
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Boot the House</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
              Gesture is candidate evidence, not selection. A human confirmation is local witness,
              not destination identity. <strong className="font-semibold text-stone-100">Cross this door</strong>{' '}
              only becomes available after the declared decoder and destination seams are live.
            </p>
          </div>
          <ShieldCheck className="h-7 w-7 text-amber-200" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-3 gap-2 text-xs">
          {[
            ['TranchNode', availability.tranchnode],
            ['Project0', availability.project0],
            ['Corpus OS', availability.corpusOs],
          ].map(([name, live]) => (
            <div key={String(name)} className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
              <div className="font-medium text-stone-700">{String(name)}</div>
              <div className={live ? 'mt-1 text-emerald-700' : 'mt-1 text-stone-500'}>
                {live ? 'local seam live' : 'unavailable'}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-2xl border border-stone-200 bg-[#f7f2e9] p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-stone-800">Garden traversal field</div>
                <div className="text-xs text-stone-500">
                  {field ? `${field.fieldRef} · ${field.sourceMode}` : 'loading bounded field'}
                </div>
              </div>
              <button
                type="button"
                onClick={resetStroke}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>

            <svg
              viewBox={`0 0 ${GARDEN_WIDTH} ${GARDEN_HEIGHT}`}
              role="img"
              aria-label="Draw a traversal gesture from the Garden toward a door"
              className="h-auto w-full touch-none select-none rounded-xl border border-stone-300 bg-white"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPointer}
              onPointerCancel={finishPointer}
            >
              <path d="M30 110 L130 110 L320 40" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-200" />
              <path d="M30 110 L130 110 L320 110" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-200" />
              <path d="M30 110 L130 110 L320 180" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-200" />
              <circle cx="30" cy="110" r="8" className="fill-amber-700" />
              <circle cx="130" cy="110" r="5" className="fill-stone-400" />
              <rect x="303" y="25" width="34" height="30" rx="6" className="fill-emerald-100 stroke-emerald-700" strokeWidth="2" />
              <rect x="303" y="95" width="34" height="30" rx="6" className="fill-stone-100 stroke-stone-400" strokeWidth="2" />
              <rect x="303" y="165" width="34" height="30" rx="6" className="fill-stone-100 stroke-stone-400" strokeWidth="2" />
              <text x="296" y="19" textAnchor="end" className="fill-stone-600 text-[10px]">Corpus</text>
              <text x="296" y="108" textAnchor="end" className="fill-stone-500 text-[10px]">Band</text>
              <text x="296" y="188" textAnchor="end" className="fill-stone-500 text-[10px]">Upper Room</text>
              {rawPoints.length > 1 && (
                <polyline
                  points={polyline}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-700"
                />
              )}
            </svg>

            <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
              {decodingStroke ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> asking TranchNode</>
              ) : (
                <><Fingerprint className="h-3.5 w-3.5" /> draw from the Garden toward a door · max 128 witnessed points</>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {loadingField ? (
              <div className="flex min-h-32 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-sm text-stone-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading field witness
              </div>
            ) : doors.map((door) => {
              const candidate = selection?.state === 'candidate' && selection.doorRef === door.doorRef;
              return (
                <div
                  key={door.doorRef}
                  className={`rounded-2xl border p-3 ${candidate ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    <DoorOpen className={`mt-0.5 h-5 w-5 ${door.reachability === 'reachable' ? 'text-emerald-700' : 'text-stone-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-stone-800">{doorTitle(door)}</div>
                      <div className="mt-1 text-xs text-stone-500">
                        {door.sourceMode} · {door.reachability} · authority {door.authority}
                      </div>
                      {candidate && (
                        <div className="mt-2 text-xs font-medium text-amber-800">gesture candidate</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selection && (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            {selection.state === 'ambiguous' ? (
              <div className="flex gap-3 text-sm text-stone-700">
                <CircleDot className="mt-0.5 h-5 w-5 text-sky-700" />
                <div>
                  <div className="font-semibold">Traversal remains ambiguous.</div>
                  <div className="mt-1 text-xs text-stone-500">{selection.leadingTemplateIds.join(' · ') || 'No unique leader'}</div>
                </div>
              </div>
            ) : selection.state === 'unresolved' ? (
              <div className="flex gap-3 text-sm text-stone-700">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <div className="font-semibold">Traversal is unresolved.</div>
                  <div className="mt-1 text-xs text-stone-500">{selection.templateId ?? 'No declared candidate'}</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-stone-800">Candidate: {selectedDoor ? doorTitle(selectedDoor) : selection.templateId}</div>
                  <div className="mt-1 text-xs text-stone-500">
                    ranked candidate · {selection.reachability} · authority {selection.authority}
                  </div>
                </div>
                {!selection.canConfirmCrossing && (
                  <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600">
                    candidate only
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">bounded testimony</span>
            <textarea
              value={testimony}
              onChange={(event) => setTestimony(event.target.value.slice(0, 800))}
              maxLength={800}
              rows={2}
              className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none ring-amber-500 focus:ring-2"
            />
            <span className="mt-1 block text-[11px] text-stone-500">
              local human confirmation · not destination identity · {testimony.length}/800
            </span>
          </label>
          <button
            type="button"
            onClick={() => void confirmCrossing()}
            disabled={!canConfirmCrossing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
          >
            {crossing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Cross this door
          </button>
        </div>

        {!liveCrossingAvailable && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-600">
            The field remains usable in fixture mode. A live crossing stays disabled until TranchNode, Project0, and Corpus OS are all configured as local donor repos.
          </div>
        )}

        {message && (
          <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {outcome && (
          <div className={`rounded-2xl border p-4 ${statusClasses(outcome.status)}`}>
            <div className="flex items-start gap-3">
              {outcome.status === 'admitted' ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <CircleDot className="mt-0.5 h-5 w-5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{outcome.status}</div>
                <div className="mt-1 text-xs opacity-80">
                  destination {outcome.destinationInvoked ? 'was invoked' : 'was not invoked'} · residue {outcome.residue.residueRef}
                </div>
                <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                  <div>
                    <div className="font-semibold">Evidence</div>
                    <div className="mt-1 break-all opacity-80">{outcome.residue.evidenceRefs.join(' · ') || 'none'}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Constituted destination refs</div>
                    <div className="mt-1 break-all opacity-80">
                      {outcome.residue.constitutedDestinationRefs.join(' · ') || 'none'}
                    </div>
                  </div>
                  {outcome.residue.unresolvedRefs.length > 0 && (
                    <div>
                      <div className="font-semibold">Unresolved / reason refs</div>
                      <div className="mt-1 break-all opacity-80">{outcome.residue.unresolvedRefs.join(' · ')}</div>
                    </div>
                  )}
                  {outcome.residue.returnRefs.length > 0 && (
                    <div>
                      <div className="font-semibold">Return refs</div>
                      <div className="mt-1 break-all opacity-80">{outcome.residue.returnRefs.join(' · ')}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
