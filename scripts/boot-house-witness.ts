import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createConfiguredWorldRuntime } from '../src/world-runtime/config.js';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`missing required environment variable ${name}`);
  return value;
}

const fullMeasureSha = requiredEnv('BOOT_HOUSE_FULL_MEASURE_SHA');
const tranchSha = requiredEnv('BOOT_HOUSE_TRANCH_SHA');
const project0Sha = requiredEnv('BOOT_HOUSE_PROJECT0_SHA');
const corpusSha = requiredEnv('BOOT_HOUSE_CORPUS_SHA');
const tranchDir = requiredEnv('BOOT_HOUSE_TRANCH_DIR');
const project0Dir = requiredEnv('BOOT_HOUSE_PROJECT0_DIR');
const corpusDir = requiredEnv('BOOT_HOUSE_CORPUS_DIR');

const sourceVersionRef = `github:the-static-collective/full-measure-world-layer@${fullMeasureSha}`;
const configured = createConfiguredWorldRuntime({
  BOOT_HOUSE_TRANCH_DIR: tranchDir,
  BOOT_HOUSE_PROJECT0_DIR: project0Dir,
  BOOT_HOUSE_CORPUS_DIR: corpusDir,
  BOOT_HOUSE_SOURCE_VERSION_REF: sourceVersionRef,
});

if (configured.available === false) {
  throw new Error(`configured Full Measure world runtime is unavailable: ${configured.reasonCode}`);
}

const runtime = configured.runtime;
const offeredSourceRef = configured.offeredWitnessRef;
const fieldBefore = runtime.getField();

if (fieldBefore.doors.length !== 3) {
  throw new Error('composed witness must begin with exactly three doors');
}
if (!fieldBefore.doors.every((door) => door.evidenceMode === 'fixture')) {
  throw new Error('nearby-door discovery must remain truthfully fixture-backed in v0.1 witness');
}

const stroke = {
  rawStrokeRef: `full-measure:boot-house-stroke:${fullMeasureSha.slice(0, 12)}`,
  points: [
    { sequence: 0, x: 100_000, y: 500_000 },
    { sequence: 1, x: 500_000, y: 500_000 },
    { sequence: 2, x: 900_000, y: 500_000 },
  ],
};

const decoded = await runtime.decodeStroke(stroke);
if (decoded.decoding.authority !== 'none') {
  throw new Error('TranchNode decoding unexpectedly carried authority');
}
if (decoded.decoding.ambiguity.leadingDoorRefs[0] !== 'door:corpus') {
  throw new Error('composed stroke did not resolve toward the Corpus door');
}

const result = await runtime.confirmCrossing({
  pendingId: decoded.pendingId,
  confirmed: true,
  doorRef: 'door:corpus',
  offeredWitnessRefs: [offeredSourceRef],
  confirmedBy: 'ci:boot-house-composed-proof',
});

if (result.kind !== 'terminal') {
  throw new Error(`composed crossing did not reach a destination disposition: ${result.kind}`);
}
if (result.residue.authority !== 'none') {
  throw new Error('returned Full Measure residue unexpectedly carried authority');
}
if (result.residue.destinationStatus !== 'admitted') {
  throw new Error(`expected admitted Corpus disposition, got ${result.residue.destinationStatus}`);
}
if (result.worldChange.kind !== 'illumination') {
  throw new Error(`expected admitted crossing to illuminate, got ${result.worldChange.kind}`);
}

const fieldAfter = runtime.getField();
if (!fieldAfter.admittedDestinationRefs.includes('corpus-os:world-encounter:v0.1')) {
  throw new Error('admitted destination was not projected as illuminated/reachable by Full Measure');
}
if (!fieldAfter.visibleResidueRefs.includes(result.residue.residueRef)) {
  throw new Error('encounter residue was not preserved in the changed field projection');
}

const receipt = {
  schema: 'full-measure.boot-house-witness/v0.1',
  witnessKind: 'ci-composed-proof',
  humanWitness: false,
  claim: 'one real configured Full Measure heartbeat completed across donor repositories without authority transfer',
  repositories: {
    fullMeasure: {
      repository: 'the-static-collective/full-measure-world-layer',
      commit: fullMeasureSha,
    },
    tranchNode: {
      repository: 'the-static-collective/tranchnode',
      commit: tranchSha,
      processSchema: 'tranchnode.intent-stroke-process/v0.1',
    },
    project0: {
      repository: 'the-static-collective/project0',
      commit: project0Sha,
      processSchema: 'project0.world-encounter-process/v0.1',
    },
    corpusOs: {
      repository: 'the-static-collective/corpus-os',
      commit: corpusSha,
      processSchema: 'corpus.world-encounter-destination/v0.1',
    },
  },
  runtimeBootstrap: {
    sourceVersionRef,
    offeredSourceRef,
    commandMode: 'configured-local-process',
    noCentralCredentials: true,
  },
  doorDiscovery: {
    evidenceMode: 'fixture',
    provenanceRef: 'fixture:boot-house/nearby-doors/v0.1',
    founderNodeLive: false,
    doors: fieldBefore.doors.map((door) => ({
      doorRef: door.doorRef,
      destinationRef: door.destinationRef,
      reachability: door.reachability,
      evidenceMode: door.evidenceMode,
      authority: door.authority,
    })),
  },
  traversal: {
    rawStrokeRef: stroke.rawStrokeRef,
    decodingRef: decoded.decoding.decodingRef,
    authority: decoded.decoding.authority,
    ambiguity: decoded.decoding.ambiguity,
  },
  crossing: {
    confirmationKind: 'explicit-ci-confirmation',
    confirmedBy: 'ci:boot-house-composed-proof',
    confirmationReceiptRef: result.residue.confirmationReceiptRef,
    offeredSourceRef,
    encounterRef: result.residue.encounterRef,
    destinationStatus: result.residue.destinationStatus,
    residueRef: result.residue.residueRef,
    residueAuthority: result.residue.authority,
    evidenceRefs: result.residue.evidenceRefs,
  },
  projection: {
    before: {
      admittedDestinationRefs: fieldBefore.admittedDestinationRefs,
      visibleResidueRefs: fieldBefore.visibleResidueRefs,
    },
    worldChange: result.worldChange,
    after: {
      admittedDestinationRefs: fieldAfter.admittedDestinationRefs,
      visibleResidueRefs: fieldAfter.visibleResidueRefs,
    },
  },
  nonClaims: [
    'this is not the required human Garden witness',
    'nearby-door discovery is fixture-backed, not live Founder Node / Pollen Scout',
    'admission does not transfer authority',
    'Full Measure admittedDestinationRefs are a local projection, not constitutional truth',
    'this does not prove route search, autonomous traversal, or a universal world graph',
  ],
};

const artifactsDir = path.resolve('artifacts/boot-house');
await mkdir(artifactsDir, { recursive: true });
const fileName = `ci-${fullMeasureSha.slice(0, 12)}.json`;
const receiptPath = path.join(artifactsDir, fileName);
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');

process.stdout.write(`${JSON.stringify({
  status: 'PASS',
  witness: receipt.schema,
  commandMode: receipt.runtimeBootstrap.commandMode,
  destinationStatus: result.residue.destinationStatus,
  worldChange: result.worldChange.kind,
  encounterRef: result.residue.encounterRef,
  residueRef: result.residue.residueRef,
  receiptPath,
})}\n`);
