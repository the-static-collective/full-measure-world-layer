import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

import {
  buildGardenEncounterEnvelope,
  createGardenCrossingRefs,
} from '../src/lib/worldRuntime/gardenEncounter.js';
import {
  GARDEN_DECODER,
  GARDEN_LAYOUT,
  GARDEN_TEMPLATES,
  normalizePointerStroke,
} from '../src/lib/worldRuntime/gardenTraversal.js';
import type {
  WorldDoorProjection,
  WorldEncounterResidue,
  WorldFieldProjection,
} from '../src/lib/worldRuntime/types.js';

const BASE_URL = process.env.FULL_MEASURE_PROOF_BASE_URL ?? 'http://127.0.0.1:3000';
const FULL_MEASURE_REF = process.env.FULL_MEASURE_PROOF_SHA ?? 'unknown-full-measure-ref';

const DONOR_REFS = Object.freeze({
  tranchnode: 'bf886c0b4938a1444a79afb7a7b384e91b5d5197',
  project0: '6341b0223f2b57148d617dcc98d1e0d0c68e14a5',
  corpusOs: '63c0be4cd49c383ae167ded99103b79ba4626416',
});

const CORPUS_DOOR_REF = 'world-door:corpus-casework-v0.1';
const CORPUS_DESTINATION_REF = 'corpus-os:casework-v0.1';
const VALID_SUBJECT_REF = 'artifact:agreement-a';
const FOREIGN_SUBJECT_REF = 'artifact:not-in-this-trust';
const ZERO_ENCOUNTER_REF = `enc-${'0'.repeat(64)}`;
const OVERSIZED_CORPUS_INPUT = 'x'.repeat(16_385);

type Availability = {
  tranchnode: boolean;
  project0: boolean;
  corpusOs: boolean;
};

type HttpResult<T> = { status: number; body: T };
type AdapterSuccess<T> = { ok: true; value: T };
type AdapterFailure = { ok: false; kind?: string; code?: string; donor?: string };
type AdapterBody<T> = AdapterSuccess<T> | AdapterFailure;

type TraversalDecoding = {
  authority: 'none';
  strokeHash: string;
  fieldLayoutRef: string;
  fingerprint: string;
  candidates: Array<{ templateId: string; totalCost: number }>;
  ambiguity: { kind: 'none' | 'collision'; leadingTemplateIds: string[] };
};

type PreparedEncounter = {
  operation: 'address';
  record: { ref: string; body: unknown };
};

type CrossingOutcome = {
  status: 'validation-failed' | 'admitted' | 'refused' | 'indeterminate' | 'failed';
  destinationInvoked: boolean;
  residue: WorldEncounterResidue;
};

async function readJsonResponse<T>(response: Response): Promise<HttpResult<T>> {
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(
      `Expected JSON from ${response.url || 'Full Measure'}; status=${response.status}; body=${text.slice(0, 400)}`,
    );
  }
  return { status: response.status, body: body as T };
}

async function getJson<T>(path: string): Promise<HttpResult<T>> {
  return await readJsonResponse<T>(await fetch(`${BASE_URL}${path}`));
}

async function postJson<T>(path: string, body: unknown): Promise<HttpResult<T>> {
  return await readJsonResponse<T>(await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

function requireAdapterSuccess<T>(result: HttpResult<AdapterBody<T>>, label: string): T {
  assert.equal(result.status, 200, `${label} HTTP status`);
  assert.equal(result.body.ok, true, `${label}: ${JSON.stringify(result.body)}`);
  if (!result.body.ok) throw new Error(`${label} failed: ${JSON.stringify(result.body)}`);
  return result.body.value;
}

function assertNoConstitutedDestinationRefs(outcome: CrossingOutcome, label: string): void {
  assert.deepEqual(
    outcome.residue.constitutedDestinationRefs,
    [],
    `${label} must not manufacture constituted destination refs`,
  );
}

async function readField() {
  const response = await getJson<{
    field: WorldFieldProjection;
    availability: Availability;
  }>('/api/world/field');
  assert.equal(response.status, 200);
  return response.body;
}

async function readDoors() {
  const response = await getJson<{
    doors: WorldDoorProjection[];
    availability: Availability;
  }>('/api/world/doors');
  assert.equal(response.status, 200);
  return response.body;
}

async function prepareEncounter(
  field: WorldFieldProjection,
  door: WorldDoorProjection,
  traversal: TraversalDecoding,
  sequence: number,
) {
  const refs = createGardenCrossingRefs('ci-proof', sequence);
  const envelope = buildGardenEncounterEnvelope({
    testimonyRef: refs.testimonyRef,
    confirmationReceiptRef: refs.confirmationReceiptRef,
    fieldRef: field.fieldRef,
    door,
    traversalFingerprint: traversal.fingerprint,
  });

  const prepared = requireAdapterSuccess(
    await postJson<AdapterBody<PreparedEncounter>>('/api/world/encounter/prepare', envelope),
    `prepare encounter ${sequence}`,
  );
  assert.match(prepared.record.ref, /^enc-[0-9a-f]{64}$/);
  return { refs, prepared };
}

async function confirmEncounter(input: {
  field: WorldFieldProjection;
  door: WorldDoorProjection;
  traversal: TraversalDecoding;
  sequence: number;
  destinationSubjectRef?: string;
  expectedEncounterRef?: string;
  testimony: string;
}) {
  const { refs, prepared } = await prepareEncounter(
    input.field,
    input.door,
    input.traversal,
    input.sequence,
  );
  const suppliedEncounterRef = input.expectedEncounterRef ?? prepared.record.ref;

  const outcome = requireAdapterSuccess(
    await postJson<AdapterBody<CrossingOutcome>>('/api/world/encounter/confirm', {
      sourceFieldRef: input.field.fieldRef,
      doorRef: input.door.doorRef,
      crossingRef: refs.crossingRef,
      confirmationReceiptRef: refs.confirmationReceiptRef,
      traversalEvidenceRefs: [
        input.traversal.fingerprint,
        input.traversal.strokeHash,
        input.traversal.fieldLayoutRef,
      ],
      encounterRef: suppliedEncounterRef,
      encounterBody: prepared.record.body,
      ...(input.destinationSubjectRef === undefined
        ? {}
        : { destinationSubjectRef: input.destinationSubjectRef }),
      input: input.testimony,
    }),
    `confirm encounter ${input.sequence}`,
  );

  return {
    preparedEncounterRef: prepared.record.ref,
    suppliedEncounterRef,
    outcome,
  };
}

async function main(): Promise<void> {
  const initialFieldState = await readField();
  assert.equal(initialFieldState.field.fieldRef, 'full-measure:garden:v0.1');
  assert.equal(initialFieldState.field.sourceMode, 'fixture');
  assert.deepEqual(initialFieldState.availability, {
    tranchnode: true,
    project0: true,
    corpusOs: true,
  });

  const initialDoorState = await readDoors();
  assert.equal(initialDoorState.doors.length, 3);
  const corpusDoor = initialDoorState.doors.find((door) => door.doorRef === CORPUS_DOOR_REF);
  assert.ok(corpusDoor);
  assert.equal(corpusDoor.destinationRef, CORPUS_DESTINATION_REF);
  assert.equal(corpusDoor.reachability, 'reachable');
  assert.equal(corpusDoor.authority, 'none');
  assert.equal(corpusDoor.sourceMode, 'fixture');

  const traversal = requireAdapterSuccess(
    await postJson<AdapterBody<TraversalDecoding>>('/api/world/stroke/decode', {
      points: normalizePointerStroke([
        { x: 30, y: 110 },
        { x: 100, y: 110 },
        { x: 150, y: 100 },
        { x: 230, y: 70 },
        { x: 320, y: 40 },
      ]),
      layout: GARDEN_LAYOUT,
      templates: GARDEN_TEMPLATES,
      decoder: GARDEN_DECODER,
    }),
    'decode traversal',
  );
  assert.equal(traversal.authority, 'none');
  assert.equal(traversal.ambiguity.kind, 'none');
  assert.equal(traversal.candidates[0]?.templateId, 'garden-to-corpus');
  assert.match(traversal.fingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.match(traversal.strokeHash, /^sha256:[0-9a-f]{64}$/);
  assert.match(traversal.fieldLayoutRef, /^sha256:[0-9a-f]{64}$/);

  const admitted = await confirmEncounter({
    field: initialFieldState.field,
    door: corpusDoor,
    traversal,
    sequence: 1,
    destinationSubjectRef: VALID_SUBJECT_REF,
    testimony: 'Boot the House CI composed witness: admitted branch.',
  });
  assert.equal(admitted.outcome.status, 'admitted');
  assert.equal(admitted.outcome.destinationInvoked, true);
  assert.ok(admitted.outcome.residue.constitutedDestinationRefs.length > 0);
  assert.ok(admitted.outcome.residue.evidenceRefs.includes(admitted.preparedEncounterRef));

  const refused = await confirmEncounter({
    field: initialFieldState.field,
    door: corpusDoor,
    traversal,
    sequence: 2,
    destinationSubjectRef: FOREIGN_SUBJECT_REF,
    testimony: 'Boot the House CI composed witness: refused branch.',
  });
  assert.equal(refused.outcome.status, 'refused');
  assert.equal(refused.outcome.destinationInvoked, true);
  assertNoConstitutedDestinationRefs(refused.outcome, 'refused branch');

  const fieldAfterRefusal = await readField();
  const doorsAfterRefusal = await readDoors();
  assert.deepEqual(fieldAfterRefusal.field, initialFieldState.field);
  assert.deepEqual(doorsAfterRefusal.doors, initialDoorState.doors);

  const indeterminate = await confirmEncounter({
    field: initialFieldState.field,
    door: corpusDoor,
    traversal,
    sequence: 3,
    testimony: 'Boot the House CI composed witness: indeterminate branch.',
  });
  assert.equal(indeterminate.outcome.status, 'indeterminate');
  assert.equal(indeterminate.outcome.destinationInvoked, true);
  assertNoConstitutedDestinationRefs(indeterminate.outcome, 'indeterminate branch');

  const failed = await confirmEncounter({
    field: initialFieldState.field,
    door: corpusDoor,
    traversal,
    sequence: 4,
    destinationSubjectRef: VALID_SUBJECT_REF,
    testimony: OVERSIZED_CORPUS_INPUT,
  });
  assert.equal(failed.outcome.status, 'failed');
  assert.equal(failed.outcome.destinationInvoked, true);
  assertNoConstitutedDestinationRefs(failed.outcome, 'failed branch');
  assert.ok(
    failed.outcome.residue.unresolvedRefs.length > 0,
    'failed branch must retain unresolved destination evidence without Full Measure interpreting donor law',
  );

  const validationFailed = await confirmEncounter({
    field: initialFieldState.field,
    door: corpusDoor,
    traversal,
    sequence: 5,
    destinationSubjectRef: VALID_SUBJECT_REF,
    expectedEncounterRef: ZERO_ENCOUNTER_REF,
    testimony: 'Boot the House CI composed witness: validation failure branch.',
  });
  assert.equal(validationFailed.outcome.status, 'validation-failed');
  assert.equal(validationFailed.outcome.destinationInvoked, false);
  assertNoConstitutedDestinationRefs(validationFailed.outcome, 'validation-failed branch');
  assert.ok(validationFailed.outcome.residue.unresolvedRefs.includes('ENCOUNTER_ADDRESS_MISMATCH'));

  const replay = await getJson<{ residue: WorldEncounterResidue }>(
    `/api/world/residue/${encodeURIComponent(admitted.outcome.residue.residueRef)}`,
  );
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body.residue, admitted.outcome.residue);

  const proof = {
    schema: 'full-measure/boot-house-proof/v0.1',
    proofKind: 'synthetic-composed-ci',
    humanWitness: false,
    generatedAt: new Date().toISOString(),
    workflow: {
      repository: process.env.GITHUB_REPOSITORY ?? null,
      runId: process.env.GITHUB_RUN_ID ?? null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    },
    fullMeasureRef: FULL_MEASURE_REF,
    donors: DONOR_REFS,
    fieldRef: initialFieldState.field.fieldRef,
    doorRef: corpusDoor.doorRef,
    traversal: {
      authority: traversal.authority,
      fingerprint: traversal.fingerprint,
      strokeHash: traversal.strokeHash,
      fieldLayoutRef: traversal.fieldLayoutRef,
      leadingTemplateId: traversal.candidates[0]?.templateId ?? null,
      ambiguityKind: traversal.ambiguity.kind,
    },
    encounters: {
      admitted: {
        encounterRef: admitted.preparedEncounterRef,
        status: admitted.outcome.status,
        destinationInvoked: admitted.outcome.destinationInvoked,
        residueRef: admitted.outcome.residue.residueRef,
        constitutedDestinationRefs: admitted.outcome.residue.constitutedDestinationRefs,
        evidenceRefs: admitted.outcome.residue.evidenceRefs,
      },
      refused: {
        encounterRef: refused.preparedEncounterRef,
        status: refused.outcome.status,
        destinationInvoked: refused.outcome.destinationInvoked,
        residueRef: refused.outcome.residue.residueRef,
        constitutedDestinationRefs: refused.outcome.residue.constitutedDestinationRefs,
        unresolvedRefs: refused.outcome.residue.unresolvedRefs,
        sourceFieldProjectionUnchanged: true,
        declaredDoorProjectionUnchanged: true,
      },
      indeterminate: {
        encounterRef: indeterminate.preparedEncounterRef,
        status: indeterminate.outcome.status,
        destinationInvoked: indeterminate.outcome.destinationInvoked,
        residueRef: indeterminate.outcome.residue.residueRef,
        constitutedDestinationRefs: indeterminate.outcome.residue.constitutedDestinationRefs,
        unresolvedRefs: indeterminate.outcome.residue.unresolvedRefs,
      },
      failed: {
        encounterRef: failed.preparedEncounterRef,
        status: failed.outcome.status,
        destinationInvoked: failed.outcome.destinationInvoked,
        residueRef: failed.outcome.residue.residueRef,
        constitutedDestinationRefs: failed.outcome.residue.constitutedDestinationRefs,
        unresolvedRefs: failed.outcome.residue.unresolvedRefs,
      },
      validationFailed: {
        preparedEncounterRef: validationFailed.preparedEncounterRef,
        suppliedEncounterRef: validationFailed.suppliedEncounterRef,
        status: validationFailed.outcome.status,
        destinationInvoked: validationFailed.outcome.destinationInvoked,
        residueRef: validationFailed.outcome.residue.residueRef,
        constitutedDestinationRefs: validationFailed.outcome.residue.constitutedDestinationRefs,
        unresolvedRefs: validationFailed.outcome.residue.unresolvedRefs,
      },
    },
    reconstruction: {
      completeness: 'partial',
      scope: 'full-measure-local-residue',
      residueRef: replay.body.residue.residueRef,
      exactResidueReplay: true,
      omittedByDesign: [
        'destination-private-state',
        'destination-warrant-body',
        'master-world-graph',
      ],
    },
    limitations: [
      'not-human-witness',
      'fixture-door-source',
      'no-network-federation',
      'composed-failed-branch-proves-failure-class-without-interpreting-donor-reason-code',
      'host-failure-branch-proven-in-corpus-native-tests',
    ],
  };

  assert.equal(proof.humanWitness, false);
  assert.deepEqual(
    Object.fromEntries(Object.entries(proof.encounters).map(([key, value]) => [key, value.status])),
    {
      admitted: 'admitted',
      refused: 'refused',
      indeterminate: 'indeterminate',
      failed: 'failed',
      validationFailed: 'validation-failed',
    },
  );
  assert.equal(proof.reconstruction.completeness, 'partial');

  await mkdir('artifacts', { recursive: true });
  await writeFile(
    'artifacts/boot-house-proof.json',
    `${JSON.stringify(proof, null, 2)}\n`,
    'utf8',
  );

  console.log(JSON.stringify({
    proof: 'boot-house-v0.1',
    humanWitness: false,
    fieldRef: proof.fieldRef,
    leadingTemplateId: proof.traversal.leadingTemplateId,
    outcomes: Object.fromEntries(
      Object.entries(proof.encounters).map(([key, value]) => [key, value.status]),
    ),
    reconstruction: proof.reconstruction.completeness,
    receipt: 'artifacts/boot-house-proof.json',
  }, null, 2));
}

main().catch(async (error: unknown) => {
  await mkdir('artifacts', { recursive: true });
  const failure = {
    schema: 'full-measure/boot-house-proof-failure/v0.1',
    proofKind: 'synthetic-composed-ci',
    humanWitness: false,
    generatedAt: new Date().toISOString(),
    workflow: {
      repository: process.env.GITHUB_REPOSITORY ?? null,
      runId: process.env.GITHUB_RUN_ID ?? null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    },
    fullMeasureRef: FULL_MEASURE_REF,
    donors: DONOR_REFS,
    error: error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack ?? null }
      : { name: 'UnknownError', message: String(error), stack: null },
  };
  await writeFile(
    'artifacts/boot-house-proof.json',
    `${JSON.stringify(failure, null, 2)}\n`,
    'utf8',
  );
  console.error(error);
  process.exitCode = 1;
});
