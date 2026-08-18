# Human Terminal v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Human Terminal as a basic-human, non-authoritative operator surface over the already-landed Full Measure world runtime, with deterministic intent interpretation, read-only contextual commands, inspectable evidence, session residue recall, and a crossing handoff that cannot bypass the existing Garden confirmation flow.

**Architecture:** Add a focused `src/lib/humanTerminal/` application layer that interprets a bounded set of human phrases into known intents and maps those intents only onto `worldRuntimeClient` read surfaces. Add a `HumanTerminalPanel` above the existing `WorldEncounterPanel`; it renders pre-seeded contextual commands, plain-language results, evidence refs, and a non-executing crossing handoff. Share only the exact latest `WorldEncounterResidue` through React session state so “what happened last time?” remains a projection over canonical residue rather than a second narrative store.

**Tech Stack:** TypeScript 5.8, React 19, Node `node:test`, React DOM server rendering, Vite, existing `src/lib/worldRuntime/client.ts` and `src/lib/worldRuntime/types.ts`.

**Spec:** `docs/superpowers/specs/2026-08-17-human-terminal-v0.1-design.md`

## Global Constraints

- Human language may project reachable operations; only existing bounded application contracts may perform them. Suggestion is not authority.
- Human Terminal MUST NOT call TranchNode, Project0, Corpus OS, Founder Node, or any future donor adapter directly; it consumes Full Measure application seams only.
- No freeform LLM-to-shell execution, arbitrary process spawning, arbitrary HTTP, repository mutation, or donor-specific freeform fallback.
- Unknown text fails closed into an unknown interpretation plus bounded visible suggestions.
- Every suggested move carries `authority: "none"`.
- Read-only operations may execute immediately; crossing operations are handoffs only and MUST NOT call `prepareEncounter` or `confirmEncounter` from the Terminal layer.
- Fixture/live/unavailable truth remains visible.
- `admitted`, `refused`, `indeterminate`, `failed`, and `validation-failed` remain distinct in plain-language residue projection.
- Garden remains the inhabited/world interface; Human Terminal remains the operator/navigation interface.
- No new server route, donor adapter, credentials plane, receipt scheme, identity scheme, master graph, or constitutional state store.
- `WorldEncounterPanel` remains the only UI that prepares/confirms the current Boot the House crossing.
- Full repository gate remains `npm run check` (`tsc --noEmit`, all `node:test` files, Vite + server build).

---

## File Structure

Create these focused units:

- `src/lib/humanTerminal/types.ts` — Human Terminal-local intents, interpretation results, move projections, and output types. No runtime calls.
- `src/lib/humanTerminal/interpret.ts` — deterministic phrase normalization and allowlisted phrase-to-intent interpretation. No I/O.
- `src/lib/humanTerminal/operator.ts` — maps known intents to existing `worldRuntimeClient` reads and produces basic-human output/evidence. No React and no donor calls.
- `src/components/HumanTerminalPanel.tsx` — terminal-like operator UI with pre-seeded commands, bounded text input, result/evidence rendering, and crossing handoff callback.

Modify only these existing units:

- `src/components/WorldEncounterPanel.tsx` — expose an exact residue callback and stable section id; no crossing semantic change.
- `src/App.tsx` — mount Human Terminal above World Threshold, retain latest exact residue in React session state, and scroll/focus the Garden for crossing handoff.

Add tests:

- `tests/human-terminal-interpret.test.ts` — phrase allowlist and unknown fail-closed behavior.
- `tests/human-terminal-operator.test.ts` — exact world-runtime read mapping, evidence preservation, truth-state rendering, and proof that crossing handoff performs zero HTTP mutation calls.
- `tests/human-terminal-panel.test.ts` — static UI contract and pre-seeded basic-human commands.
- `tests/app-human-terminal.test.ts` — mounting order and stable Garden handoff target.

Do not modify `server.ts`, `src/lib/worldRuntime/routes.ts`, `src/lib/worldRuntime/http.ts`, `src/lib/worldRuntime/orchestrator.ts`, or any donor adapter for this slice.

---

### Task 1: Define the bounded Human Terminal grammar

**Files:**
- Create: `src/lib/humanTerminal/types.ts`
- Create: `src/lib/humanTerminal/interpret.ts`
- Test: `tests/human-terminal-interpret.test.ts`

**Interfaces:**
- Produces: `HumanTerminalKnownIntent`, `HumanTerminalInterpretation`, `HumanTerminalMove`, `HumanTerminalOutput`, `HumanTerminalExecutionContext`.
- Produces: `interpretHumanTerminalInput(input, context)`.
- Consumes: `WorldSourceMode`, `WorldEncounterOutcomeClass` from `src/lib/worldRuntime/types.ts` only for projection typing.

- [ ] **Step 1: Write the failing interpretation tests**

Create `tests/human-terminal-interpret.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { interpretHumanTerminalInput } from '../src/lib/humanTerminal/interpret.js';

test('basic-human aliases resolve only to known operator intents', () => {
  assert.deepEqual(interpretHumanTerminalInput('Where am I?'), {
    recognized: true,
    intent: { kind: 'orient' },
  });
  assert.deepEqual(interpretHumanTerminalInput('what doors are nearby'), {
    recognized: true,
    intent: { kind: 'list-nearby-doors' },
  });
  assert.deepEqual(interpretHumanTerminalInput('What can I safely do?'), {
    recognized: true,
    intent: { kind: 'list-safe-moves' },
  });
  assert.deepEqual(
    interpretHumanTerminalInput('Why is this door here?', {
      selectedDoorRef: 'world-door:corpus-casework-v0.1',
    }),
    {
      recognized: true,
      intent: {
        kind: 'explain-door',
        doorRef: 'world-door:corpus-casework-v0.1',
      },
    },
  );
});

test('session context supplies exact residue and selected-door refs without guessing', () => {
  assert.deepEqual(
    interpretHumanTerminalInput('What happened last time?', {
      lastResidueRef: 'world-residue:000001',
    }),
    {
      recognized: true,
      intent: { kind: 'inspect-residue', residueRef: 'world-residue:000001' },
    },
  );

  assert.deepEqual(
    interpretHumanTerminalInput('Enter a crossing', {
      selectedDoorRef: 'world-door:corpus-casework-v0.1',
    }),
    {
      recognized: true,
      intent: {
        kind: 'begin-crossing',
        doorRef: 'world-door:corpus-casework-v0.1',
      },
    },
  );
});

test('unknown language fails closed and never becomes a command', () => {
  assert.deepEqual(interpretHumanTerminalInput('rm -rf everything'), {
    recognized: false,
    normalizedInput: 'rm -rf everything',
  });
  assert.deepEqual(interpretHumanTerminalInput('deploy all repos and merge whatever is green'), {
    recognized: false,
    normalizedInput: 'deploy all repos and merge whatever is green',
  });
});

test('context-dependent phrases stay unknown when the required exact ref is absent', () => {
  assert.deepEqual(interpretHumanTerminalInput('Why is this door here?'), {
    recognized: false,
    normalizedInput: 'why is this door here',
  });
  assert.deepEqual(interpretHumanTerminalInput('What happened last time?'), {
    recognized: false,
    normalizedInput: 'what happened last time',
  });
});
```

- [ ] **Step 2: Run the interpretation test to verify RED**

Run:

```bash
node --import tsx --test tests/human-terminal-interpret.test.ts
```

Expected: FAIL because `src/lib/humanTerminal/interpret.ts` does not exist.

- [ ] **Step 3: Add exact Human Terminal-local types**

Create `src/lib/humanTerminal/types.ts`:

```ts
import type {
  WorldEncounterOutcomeClass,
  WorldSourceMode,
} from '../worldRuntime/types.js';

export type HumanTerminalKnownIntent =
  | { kind: 'orient' }
  | { kind: 'list-nearby-doors' }
  | { kind: 'explain-door'; doorRef: string }
  | { kind: 'list-safe-moves' }
  | { kind: 'inspect-residue'; residueRef: string }
  | { kind: 'explain-evidence'; evidenceRefs: string[] }
  | { kind: 'list-human-gates' }
  | { kind: 'begin-crossing'; doorRef?: string };

export type HumanTerminalInterpretation =
  | { recognized: true; intent: HumanTerminalKnownIntent }
  | { recognized: false; normalizedInput: string };

export interface HumanTerminalInterpretContext {
  selectedDoorRef?: string;
  lastResidueRef?: string;
  evidenceRefs?: string[];
}

export type HumanTerminalMoveState =
  | 'read-only'
  | 'requires-human-confirmation'
  | 'unavailable'
  | 'blocked'
  | 'unknown';

export interface HumanTerminalMove {
  moveRef: string;
  label: string;
  explanation: string;
  intent: HumanTerminalKnownIntent;
  state: HumanTerminalMoveState;
  evidenceRefs: string[];
  sourceMode?: WorldSourceMode;
  authority: 'none';
}

export interface HumanTerminalExecutionContext {
  lastResidueRef?: string;
}

export interface HumanTerminalOutput {
  intent: HumanTerminalKnownIntent;
  status: 'ok' | 'unavailable' | 'unknown';
  heading: string;
  lines: string[];
  evidenceRefs: string[];
  moves: HumanTerminalMove[];
  sourceMode?: WorldSourceMode;
  outcomeClass?: WorldEncounterOutcomeClass;
  handoff?: {
    kind: 'garden-crossing';
    doorRef?: string;
  };
}
```

Keep these types Full Measure-local. Do not move them into `src/lib/worldRuntime/types.ts`; the Terminal vocabulary is an application projection, not world-runtime constitutional law.

- [ ] **Step 4: Implement the deterministic interpreter**

Create `src/lib/humanTerminal/interpret.ts`:

```ts
import type {
  HumanTerminalInterpretation,
  HumanTerminalInterpretContext,
} from './types.js';

function normalize(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[?!.,]+$/g, '')
    .replace(/\s+/g, ' ');
}

const ORIENT = new Set(['where am i', 'orient', 'orient me']);
const DOORS = new Set(['what doors are nearby', 'nearby doors', 'show doors']);
const SAFE_MOVES = new Set(['what can i safely do', 'what can i do', 'safe moves']);
const EXPLAIN_DOOR = new Set(['why is this door here', 'why this door']);
const LAST = new Set(['what happened last time', 'last residue', 'what happened']);
const EVIDENCE = new Set(['show me the evidence', 'show evidence', 'evidence']);
const HUMAN_GATES = new Set(['what needs me', 'human gates', 'what needs a human']);
const CROSS = new Set(['enter a crossing', 'begin crossing', 'cross a door']);

export function interpretHumanTerminalInput(
  input: string,
  context: HumanTerminalInterpretContext = {},
): HumanTerminalInterpretation {
  const normalizedInput = normalize(input);

  if (ORIENT.has(normalizedInput)) {
    return { recognized: true, intent: { kind: 'orient' } };
  }
  if (DOORS.has(normalizedInput)) {
    return { recognized: true, intent: { kind: 'list-nearby-doors' } };
  }
  if (SAFE_MOVES.has(normalizedInput)) {
    return { recognized: true, intent: { kind: 'list-safe-moves' } };
  }
  if (EXPLAIN_DOOR.has(normalizedInput) && context.selectedDoorRef) {
    return {
      recognized: true,
      intent: { kind: 'explain-door', doorRef: context.selectedDoorRef },
    };
  }
  if (LAST.has(normalizedInput) && context.lastResidueRef) {
    return {
      recognized: true,
      intent: { kind: 'inspect-residue', residueRef: context.lastResidueRef },
    };
  }
  if (EVIDENCE.has(normalizedInput) && context.evidenceRefs?.length) {
    return {
      recognized: true,
      intent: { kind: 'explain-evidence', evidenceRefs: [...context.evidenceRefs] },
    };
  }
  if (HUMAN_GATES.has(normalizedInput)) {
    return { recognized: true, intent: { kind: 'list-human-gates' } };
  }
  if (CROSS.has(normalizedInput)) {
    return {
      recognized: true,
      intent: { kind: 'begin-crossing', doorRef: context.selectedDoorRef },
    };
  }

  return { recognized: false, normalizedInput };
}
```

Do not add fuzzy matching, edit distance, model calls, regexes that manufacture arbitrary command parameters, or a shell fallback.

- [ ] **Step 5: Run the interpretation test to verify GREEN**

Run:

```bash
node --import tsx --test tests/human-terminal-interpret.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Commit the grammar**

```bash
git add src/lib/humanTerminal/types.ts src/lib/humanTerminal/interpret.ts tests/human-terminal-interpret.test.ts
git commit -m "feat: add bounded Human Terminal grammar"
```

---

### Task 2: Map known intents onto world-runtime reads only

**Files:**
- Create: `src/lib/humanTerminal/operator.ts`
- Test: `tests/human-terminal-operator.test.ts`

**Interfaces:**
- Consumes: `HumanTerminalKnownIntent`, `HumanTerminalOutput`, `HumanTerminalMove` from Task 1.
- Consumes: `createWorldRuntimeClient`, `worldRuntimeClient`, and the exact existing routes hidden behind that client.
- Produces: `createHumanTerminalOperator(client?)` with `execute(intent)`.
- Invariant: `begin-crossing` returns a handoff object and performs zero HTTP calls.

- [ ] **Step 1: Write failing operator tests using the real browser-client seam with fake fetch**

Create `tests/human-terminal-operator.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import { createHumanTerminalOperator } from '../src/lib/humanTerminal/operator.js';
import { createWorldRuntimeClient } from '../src/lib/worldRuntime/client.js';

function fakeFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Array<{ url: string; init?: any }> = [];
  const fetcher = async (url: string, init?: any) => {
    calls.push({ url, init });
    const next = responses.shift() ?? {
      status: 500,
      body: { error: 'missing fixture response' },
    };
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      async json() {
        return next.body;
      },
    };
  };
  return { calls, fetcher };
}

const FIELD = {
  fieldRef: 'world-field:garden-v0.1',
  projectionVersion: '0.1',
  sourceMode: 'fixture' as const,
  sourceRefs: ['fixture:field'],
  unresolvedRefs: ['frontier:one'],
  excludedSourceClasses: ['destination-body'],
};

const CORPUS_DOOR = {
  doorRef: 'world-door:corpus-casework-v0.1',
  destinationRef: 'corpus-os:casework',
  relation: 'constitutional-casework',
  reachability: 'reachable' as const,
  provenanceRefs: ['fixture:corpus-door'],
  relevanceReasons: ['destination can evaluate the declared encounter'],
  requiredCrossingProfile: 'project0-world-encounter-v0.1',
  authority: 'none' as const,
  sourceMode: 'fixture' as const,
};

test('orientation reads only the Full Measure field projection', async () => {
  const fixture = fakeFetch([
    { status: 200, body: { field: FIELD, availability: {} } },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({ kind: 'orient' });

  assert.deepEqual(fixture.calls.map((call) => call.url), ['/api/world/field']);
  assert.equal(output.status, 'ok');
  assert.equal(output.sourceMode, 'fixture');
  assert.deepEqual(output.evidenceRefs, ['fixture:field']);
  assert.match(output.lines.join(' '), /fixture-backed/i);
});

test('door explanation uses projected boundary metadata and never fetches a destination body', async () => {
  const fixture = fakeFetch([
    { status: 200, body: { doors: [CORPUS_DOOR], availability: {} } },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'explain-door',
    doorRef: CORPUS_DOOR.doorRef,
  });

  assert.deepEqual(fixture.calls.map((call) => call.url), ['/api/world/doors']);
  assert.equal(output.status, 'ok');
  assert.deepEqual(output.evidenceRefs, ['fixture:corpus-door']);
  assert.match(output.lines.join(' '), /authority: none/i);
  assert.match(output.lines.join(' '), /destination can evaluate/i);
});

test('safe moves preserve read-only, confirmation, blocked, source-mode, and authority truth', async () => {
  const blockedDoor = {
    ...CORPUS_DOOR,
    doorRef: 'world-door:blocked',
    destinationRef: 'other:blocked',
    reachability: 'blocked' as const,
    provenanceRefs: ['fixture:blocked'],
  };
  const fixture = fakeFetch([
    { status: 200, body: { doors: [CORPUS_DOOR, blockedDoor], availability: {} } },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({ kind: 'list-safe-moves' });

  const corpusCross = output.moves.find(
    (move) => move.intent.kind === 'begin-crossing' && move.intent.doorRef === CORPUS_DOOR.doorRef,
  );
  const blockedCross = output.moves.find(
    (move) => move.intent.kind === 'begin-crossing' && move.intent.doorRef === blockedDoor.doorRef,
  );

  assert.equal(corpusCross?.state, 'requires-human-confirmation');
  assert.equal(corpusCross?.authority, 'none');
  assert.equal(corpusCross?.sourceMode, 'fixture');
  assert.equal(blockedCross?.state, 'blocked');
});

test('residue projection preserves exact outcome class and exact evidence refs', async () => {
  const fixture = fakeFetch([
    {
      status: 200,
      body: {
        residue: {
          residueRef: 'world-residue:000001',
          sourceFieldRef: FIELD.fieldRef,
          doorRef: CORPUS_DOOR.doorRef,
          crossingRef: 'world-crossing:000001',
          outcomeClass: 'validation-failed',
          evidenceRefs: ['project0:validation'],
          unresolvedRefs: [],
          returnRefs: [],
          constitutedDestinationRefs: [],
        },
      },
    },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'inspect-residue',
    residueRef: 'world-residue:000001',
  });

  assert.equal(output.outcomeClass, 'validation-failed');
  assert.deepEqual(output.evidenceRefs, ['project0:validation']);
  assert.match(output.lines.join(' '), /destination was not invoked/i);
  assert.equal(output.lines.join(' ').includes('refused'), false);
});

test('begin-crossing is a handoff and performs zero HTTP calls', async () => {
  const fixture = fakeFetch([]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'begin-crossing',
    doorRef: CORPUS_DOOR.doorRef,
  });

  assert.deepEqual(fixture.calls, []);
  assert.deepEqual(output.handoff, {
    kind: 'garden-crossing',
    doorRef: CORPUS_DOOR.doorRef,
  });
  assert.match(output.lines.join(' '), /explicit human confirmation/i);
});
```

- [ ] **Step 2: Run the operator test to verify RED**

Run:

```bash
node --import tsx --test tests/human-terminal-operator.test.ts
```

Expected: FAIL because `src/lib/humanTerminal/operator.ts` does not exist.

- [ ] **Step 3: Implement the operator with no mutation methods**

Create `src/lib/humanTerminal/operator.ts` with this structure:

```ts
import {
  createWorldRuntimeClient,
  worldRuntimeClient,
} from '../worldRuntime/client.js';
import type {
  WorldDoorProjection,
  WorldEncounterResidue,
  WorldFieldProjection,
} from '../worldRuntime/types.js';
import type {
  HumanTerminalKnownIntent,
  HumanTerminalMove,
  HumanTerminalOutput,
} from './types.js';

type WorldRuntimeClient = ReturnType<typeof createWorldRuntimeClient>;

type Availability = {
  tranchnode?: boolean;
  project0?: boolean;
  corpusOs?: boolean;
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function unavailable(
  intent: HumanTerminalKnownIntent,
  heading: string,
  line: string,
): HumanTerminalOutput {
  return {
    intent,
    status: 'unavailable',
    heading,
    lines: [line],
    evidenceRefs: [],
    moves: [],
  };
}

function residueLines(residue: WorldEncounterResidue): string[] {
  const lines = [
    `Crossing ${residue.crossingRef} ended as ${residue.outcomeClass}.`,
    `Door: ${residue.doorRef}.`,
  ];

  if (residue.outcomeClass === 'validation-failed') {
    lines.push('Project0 validation failed before destination invocation; this was not a destination refusal.');
  } else if (residue.outcomeClass === 'refused') {
    lines.push('The destination evaluated the encounter and refused it; refused state did not become constituted destination state.');
  } else if (residue.outcomeClass === 'indeterminate') {
    lines.push('The destination did not resolve the encounter into admission or refusal; the frontier remains unresolved.');
  } else if (residue.outcomeClass === 'failed') {
    lines.push('The destination path failed operationally; failure is not constitutional refusal.');
  } else {
    lines.push(`Admitted destination refs: ${residue.constitutedDestinationRefs.join(', ') || 'none recorded'}.`);
  }

  if (residue.unresolvedRefs.length > 0) {
    lines.push(`Unresolved refs remain: ${residue.unresolvedRefs.join(', ')}.`);
  }
  return lines;
}

function doorMoves(doors: WorldDoorProjection[]): HumanTerminalMove[] {
  return doors.flatMap((door) => {
    const evidenceRefs = unique(door.provenanceRefs);
    const explain: HumanTerminalMove = {
      moveRef: `human-terminal:explain:${door.doorRef}`,
      label: `Why is ${door.destinationRef} nearby?`,
      explanation: 'Inspect only the evidence already projected at this door.',
      intent: { kind: 'explain-door', doorRef: door.doorRef },
      state: 'read-only',
      evidenceRefs,
      sourceMode: door.sourceMode,
      authority: 'none',
    };
    const cross: HumanTerminalMove = {
      moveRef: `human-terminal:cross:${door.doorRef}`,
      label: `Enter crossing toward ${door.destinationRef}`,
      explanation: 'Hand off to the existing Garden crossing flow; this suggestion does not authorize the crossing.',
      intent: { kind: 'begin-crossing', doorRef: door.doorRef },
      state:
        door.reachability === 'reachable'
          ? 'requires-human-confirmation'
          : door.reachability === 'blocked'
            ? 'blocked'
            : 'unknown',
      evidenceRefs,
      sourceMode: door.sourceMode,
      authority: 'none',
    };
    return [explain, cross];
  });
}

export function createHumanTerminalOperator(
  client: WorldRuntimeClient = worldRuntimeClient,
) {
  return {
    async execute(intent: HumanTerminalKnownIntent): Promise<HumanTerminalOutput> {
      switch (intent.kind) {
        case 'orient': {
          const result = await client.getField<{
            field: WorldFieldProjection;
            availability: Availability;
          }>();
          if (!result.ok) {
            return unavailable(intent, 'Where you are', 'The current Full Measure field cannot be witnessed right now.');
          }
          const field = result.body.field;
          return {
            intent,
            status: 'ok',
            heading: 'Where you are',
            lines: [
              `You are in ${field.fieldRef}.`,
              field.sourceMode === 'fixture'
                ? 'This field projection is fixture-backed.'
                : 'This field projection is live.',
              field.unresolvedRefs.length > 0
                ? `Unresolved refs remain: ${field.unresolvedRefs.join(', ')}.`
                : 'No unresolved refs are declared on this field projection.',
            ],
            evidenceRefs: unique(field.sourceRefs),
            moves: [],
            sourceMode: field.sourceMode,
          };
        }

        case 'list-nearby-doors': {
          const result = await client.getDoors<{
            doors: WorldDoorProjection[];
            availability: Availability;
          }>();
          if (!result.ok) {
            return unavailable(intent, 'Nearby doors', 'Nearby-door projection is unavailable; no destination body was inspected.');
          }
          const doors = result.body.doors;
          return {
            intent,
            status: 'ok',
            heading: 'Nearby doors',
            lines: doors.length
              ? doors.map(
                  (door) =>
                    `${door.destinationRef}: ${door.reachability}; ${door.sourceMode}; authority: none.`,
                )
              : ['No nearby doors are currently projected.'],
            evidenceRefs: unique(doors.flatMap((door) => door.provenanceRefs)),
            moves: doorMoves(doors),
          };
        }

        case 'explain-door': {
          const result = await client.getDoors<{
            doors: WorldDoorProjection[];
            availability: Availability;
          }>();
          if (!result.ok) {
            return unavailable(intent, 'Why this door is here', 'The current door projection cannot be witnessed right now.');
          }
          const door = result.body.doors.find((candidate) => candidate.doorRef === intent.doorRef);
          if (!door) {
            return unavailable(intent, 'Why this door is here', `Door ${intent.doorRef} is not in the current projection.`);
          }
          return {
            intent,
            status: 'ok',
            heading: `Why ${door.destinationRef} is nearby`,
            lines: [
              `Relation: ${door.relation}.`,
              `Reachability: ${door.reachability}.`,
              `Source: ${door.sourceMode}.`,
              `Authority: none. Visibility does not grant permission.`,
              ...door.relevanceReasons.map((reason) => `Reason: ${reason}.`),
            ],
            evidenceRefs: unique(door.provenanceRefs),
            moves: doorMoves([door]),
            sourceMode: door.sourceMode,
          };
        }

        case 'list-safe-moves': {
          const result = await client.getDoors<{
            doors: WorldDoorProjection[];
            availability: Availability;
          }>();
          if (!result.ok) {
            return unavailable(intent, 'What you can safely do', 'Door state is unavailable, so the Terminal will not invent crossing options.');
          }
          const baseMoves: HumanTerminalMove[] = [
            {
              moveRef: 'human-terminal:orient',
              label: 'Where am I?',
              explanation: 'Read the current Full Measure field projection.',
              intent: { kind: 'orient' },
              state: 'read-only',
              evidenceRefs: [],
              authority: 'none',
            },
            {
              moveRef: 'human-terminal:doors',
              label: 'What doors are nearby?',
              explanation: 'Read current boundary metadata only.',
              intent: { kind: 'list-nearby-doors' },
              state: 'read-only',
              evidenceRefs: [],
              authority: 'none',
            },
          ];
          return {
            intent,
            status: 'ok',
            heading: 'What you can safely do',
            lines: ['These are projections from current Full Measure state. None of them carries authority by being suggested.'],
            evidenceRefs: unique(result.body.doors.flatMap((door) => door.provenanceRefs)),
            moves: [...baseMoves, ...doorMoves(result.body.doors)],
          };
        }

        case 'inspect-residue': {
          const result = await client.getResidue<{ residue: WorldEncounterResidue }>(intent.residueRef);
          if (!result.ok) {
            return unavailable(intent, 'What happened', `Residue ${intent.residueRef} cannot be read.`);
          }
          const residue = result.body.residue;
          return {
            intent,
            status: 'ok',
            heading: 'What happened',
            lines: residueLines(residue),
            evidenceRefs: unique([
              ...residue.evidenceRefs,
              ...residue.returnRefs,
            ]),
            moves: [],
            outcomeClass: residue.outcomeClass,
          };
        }

        case 'explain-evidence':
          return {
            intent,
            status: intent.evidenceRefs.length ? 'ok' : 'unknown',
            heading: 'Evidence',
            lines: intent.evidenceRefs.length
              ? ['These are the exact refs carried by the current Terminal result. The Terminal does not upgrade their authority.']
              : ['No evidence refs are available in the current Terminal result.'],
            evidenceRefs: unique(intent.evidenceRefs),
            moves: [],
          };

        case 'list-human-gates':
          return {
            intent,
            status: 'ok',
            heading: 'What still needs a human',
            lines: [
              'Any crossing still requires the existing explicit human confirmation in the Garden.',
              'The Terminal itself does not satisfy or bypass that witness gate.',
            ],
            evidenceRefs: [],
            moves: [],
          };

        case 'begin-crossing':
          return {
            intent,
            status: 'ok',
            heading: 'Crossing handoff',
            lines: [
              'The Terminal can take you to the Garden crossing surface.',
              'The crossing still requires the existing gesture/candidate flow and explicit human confirmation.',
            ],
            evidenceRefs: [],
            moves: [],
            handoff: {
              kind: 'garden-crossing',
              doorRef: intent.doorRef,
            },
          };
      }
    },
  };
}
```

Do not import `prepareEncounter`, `confirmEncounter`, any donor adapter, `child_process`, or any server module into this file.

- [ ] **Step 4: Run the operator test to verify GREEN**

Run:

```bash
node --import tsx --test tests/human-terminal-operator.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Run the existing world-runtime client test as a regression check**

Run:

```bash
node --import tsx --test tests/world-runtime-client.test.ts
```

Expected: PASS; the client still exposes exactly the existing six mounted routes and Human Terminal added none.

- [ ] **Step 6: Commit the read-only operator**

```bash
git add src/lib/humanTerminal/operator.ts tests/human-terminal-operator.test.ts
git commit -m "feat: project Human Terminal operations"
```

---

### Task 3: Build the pre-seeded basic-human terminal panel

**Files:**
- Create: `src/components/HumanTerminalPanel.tsx`
- Test: `tests/human-terminal-panel.test.ts`

**Interfaces:**
- Consumes: `interpretHumanTerminalInput`, `createHumanTerminalOperator`.
- Props: `lastResidueRef?: string`, `onBeginCrossing?: (doorRef?: string) => void`.
- Produces: visible pre-seeded contextual commands and inspectable evidence refs.
- No direct donor calls and no direct crossing mutation calls.

- [ ] **Step 1: Write the failing static UI contract test**

Create `tests/human-terminal-panel.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { HumanTerminalPanel } from '../src/components/HumanTerminalPanel.js';

test('Human Terminal renders bounded basic-human commands before browser effects run', () => {
  const html = renderToStaticMarkup(React.createElement(HumanTerminalPanel));

  assert.match(html, /Human Terminal/);
  assert.match(html, /Where am I\?/);
  assert.match(html, /What doors are nearby\?/);
  assert.match(html, /What can I safely do\?/);
  assert.match(html, /What happened last time\?/);
  assert.match(html, /What needs me\?/);
  assert.match(html, /Suggestion is not authority/);
  assert.match(html, /basic human/i);
});
```

- [ ] **Step 2: Run the panel test to verify RED**

Run:

```bash
node --import tsx --test tests/human-terminal-panel.test.ts
```

Expected: FAIL because `HumanTerminalPanel.tsx` does not exist.

- [ ] **Step 3: Implement the panel with bounded input and contextual buttons**

Create `src/components/HumanTerminalPanel.tsx` using the following behavior and state shape:

```tsx
import React, { useMemo, useState } from 'react';
import { ChevronRight, Command, ExternalLink, ShieldCheck } from 'lucide-react';

import { interpretHumanTerminalInput } from '../lib/humanTerminal/interpret.js';
import { createHumanTerminalOperator } from '../lib/humanTerminal/operator.js';
import type {
  HumanTerminalKnownIntent,
  HumanTerminalOutput,
} from '../lib/humanTerminal/types.js';

interface Props {
  lastResidueRef?: string;
  onBeginCrossing?: (doorRef?: string) => void;
}

const SEEDED_COMMANDS = [
  'Where am I?',
  'What doors are nearby?',
  'What can I safely do?',
  'What happened last time?',
  'What needs me?',
] as const;

export function HumanTerminalPanel({ lastResidueRef, onBeginCrossing }: Props) {
  const operator = useMemo(() => createHumanTerminalOperator(), []);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<HumanTerminalOutput | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedDoorRef, setSelectedDoorRef] = useState<string | undefined>();
  const [unknownInput, setUnknownInput] = useState<string | null>(null);

  const runIntent = async (intent: HumanTerminalKnownIntent) => {
    setBusy(true);
    setUnknownInput(null);
    const next = await operator.execute(intent);
    setOutput(next);
    setBusy(false);

    if (intent.kind === 'explain-door') {
      setSelectedDoorRef(intent.doorRef);
    }
    if (next.handoff?.kind === 'garden-crossing') {
      onBeginCrossing?.(next.handoff.doorRef);
    }
  };

  const runText = async (raw: string) => {
    const interpretation = interpretHumanTerminalInput(raw, {
      selectedDoorRef,
      lastResidueRef,
      evidenceRefs: output?.evidenceRefs,
    });
    if (!interpretation.recognized) {
      setUnknownInput(interpretation.normalizedInput);
      return;
    }
    await runIntent(interpretation.intent);
  };

  return (
    <section className="mb-6 overflow-hidden rounded-3xl border border-stone-300 bg-stone-950 text-stone-50 shadow-sm">
      <div className="border-b border-stone-800 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              <Command className="h-4 w-4" aria-hidden="true" />
              Human Terminal
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">The House, in basic human.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
              Ask what the current Full Measure world can actually witness. Suggestions are projections only.
              <strong className="font-semibold text-stone-100"> Suggestion is not authority.</strong>
            </p>
          </div>
          <ShieldCheck className="h-7 w-7 text-amber-200" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          {SEEDED_COMMANDS.map((command) => (
            <button
              key={command}
              type="button"
              onClick={() => void runText(command)}
              className="rounded-full border border-stone-700 bg-stone-900 px-3 py-2 text-xs font-medium text-stone-200 hover:border-amber-300 hover:text-amber-100"
            >
              {command}
            </button>
          ))}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim() || busy) return;
            void runText(input);
          }}
        >
          <label htmlFor="human-terminal-input" className="sr-only">Human Terminal command</label>
          <input
            id="human-terminal-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="where am I?"
            className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-black/30 px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-300"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex items-center gap-1 rounded-xl border border-amber-300/60 bg-amber-200/10 px-3 py-2 text-sm font-semibold text-amber-100 disabled:opacity-40"
          >
            Ask <ChevronRight className="h-4 w-4" />
          </button>
        </form>

        {unknownInput && (
          <div className="rounded-xl border border-stone-700 bg-stone-900 p-3 text-sm text-stone-300">
            I do not have a bounded operation for “{unknownInput}”. Choose one of the visible commands instead.
          </div>
        )}

        {output && (
          <div className="space-y-3 rounded-2xl border border-stone-700 bg-stone-900/70 p-4">
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-stone-500">{output.status}</div>
              <h3 className="mt-1 font-semibold text-stone-100">{output.heading}</h3>
            </div>
            <div className="space-y-1 text-sm leading-6 text-stone-300">
              {output.lines.map((line) => <p key={line}>{line}</p>)}
            </div>

            {output.moves.length > 0 && (
              <div className="grid gap-2">
                {output.moves.map((move) => (
                  <button
                    key={move.moveRef}
                    type="button"
                    disabled={move.state === 'blocked' || move.state === 'unavailable'}
                    onClick={() => void runIntent(move.intent)}
                    className="rounded-xl border border-stone-700 bg-black/20 p-3 text-left disabled:opacity-45"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-stone-100">{move.label}</span>
                      <span className="text-[10px] uppercase tracking-wider text-stone-500">{move.state}</span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-stone-400">{move.explanation}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-amber-200/70">authority: none</p>
                  </button>
                ))}
              </div>
            )}

            {output.evidenceRefs.length > 0 && (
              <details className="rounded-xl border border-stone-800 bg-black/20 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-stone-300">Show evidence refs</summary>
                <ul className="mt-2 space-y-1 font-mono text-[11px] text-stone-500">
                  {output.evidenceRefs.map((ref) => <li key={ref}>{ref}</li>)}
                </ul>
              </details>
            )}

            {output.handoff?.kind === 'garden-crossing' && (
              <div className="flex items-center gap-2 text-xs text-amber-100">
                <ExternalLink className="h-3.5 w-3.5" /> Garden handoff requested; crossing is still unconfirmed.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
```

Use existing Tailwind-style utility conventions only. Do not add a new CSS framework, terminal emulator, ANSI parser, xterm dependency, or model dependency.

- [ ] **Step 4: Run the panel test to verify GREEN**

Run:

```bash
node --import tsx --test tests/human-terminal-panel.test.ts
```

Expected: PASS, 1 test.

- [ ] **Step 5: Commit the operator UI**

```bash
git add src/components/HumanTerminalPanel.tsx tests/human-terminal-panel.test.ts
git commit -m "feat: add Human Terminal panel"
```

---

### Task 4: Bind the Terminal to exact session residue and Garden handoff

**Files:**
- Modify: `src/components/WorldEncounterPanel.tsx`
- Modify: `src/App.tsx`
- Test: `tests/app-human-terminal.test.ts`
- Modify test: `tests/world-encounter-panel.test.ts`

**Interfaces:**
- `WorldEncounterPanel` gains optional prop `onResidue?: (residue: WorldEncounterResidue) => void`.
- `WorldEncounterPanel` root section gains `id="world-threshold"`.
- `App` owns `lastWorldResidue: WorldEncounterResidue | null` in React memory only.
- `HumanTerminalPanel` receives `lastResidueRef={lastWorldResidue?.residueRef}`.
- Terminal crossing handoff scrolls to `#world-threshold`; it does not invoke `prepareEncounter` or `confirmEncounter`.

- [ ] **Step 1: Extend the World Threshold static test first**

Modify `tests/world-encounter-panel.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { WorldEncounterPanel } from '../src/components/WorldEncounterPanel.js';

test('World Threshold renders the constitutional interaction copy before browser effects run', () => {
  const html = renderToStaticMarkup(React.createElement(WorldEncounterPanel));
  assert.match(html, /id="world-threshold"/);
  assert.match(html, /World Threshold/);
  assert.match(html, /Prototype · fixture doors/);
  assert.match(html, /Gesture is candidate evidence/);
  assert.match(html, /Cross this door/);
  assert.match(html, /not destination identity/);
});
```

Create `tests/app-human-terminal.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import App from '../src/App.js';

test('campfire mounts Human Terminal before the inhabited World Threshold', () => {
  const html = renderToStaticMarkup(React.createElement(App));
  const terminal = html.indexOf('Human Terminal');
  const threshold = html.indexOf('World Threshold');

  assert.notEqual(terminal, -1);
  assert.notEqual(threshold, -1);
  assert.ok(terminal < threshold);
  assert.match(html, /id="world-threshold"/);
});
```

- [ ] **Step 2: Run the two tests to verify RED**

Run:

```bash
node --import tsx --test tests/world-encounter-panel.test.ts tests/app-human-terminal.test.ts
```

Expected: FAIL because `WorldEncounterPanel` has no stable id and `App` does not mount Human Terminal.

- [ ] **Step 3: Add exact residue emission without changing crossing law**

In `src/components/WorldEncounterPanel.tsx`, add props immediately after the existing local types:

```ts
interface Props {
  onResidue?: (residue: WorldEncounterResidue) => void;
}
```

Change the component signature:

```ts
export function WorldEncounterPanel({ onResidue }: Props = {}) {
```

Change the root section opening tag to include the stable handoff target:

```tsx
<section
  id="world-threshold"
  className="mb-8 overflow-hidden rounded-3xl border border-stone-300 bg-white shadow-sm"
>
```

At the successful end of `confirmCrossing`, after the existing structured `ok` checks and before/after `setOutcome`, preserve the exact returned residue:

```ts
const nextOutcome = confirmed.body.value;
setOutcome(nextOutcome);
onResidue?.(nextOutcome.residue);
```

Do not emit a residue on HTTP failure, donor refusal wrapper failure, preparation failure, or any state before `confirmed.body.value` exists. The callback transports the exact Full Measure residue object already returned by the existing flow; it does not manufacture a summary.

- [ ] **Step 4: Mount Human Terminal in App and keep latest residue in React session memory only**

In `src/App.tsx`, add imports:

```ts
import { HumanTerminalPanel } from './components/HumanTerminalPanel';
import type { WorldEncounterResidue } from './lib/worldRuntime/types';
```

Add state beside the existing top-level view state:

```ts
const [lastWorldResidue, setLastWorldResidue] = useState<WorldEncounterResidue | null>(null);
```

Add a pure UI handoff function before the return:

```ts
const handleBeginWorldCrossing = () => {
  document.getElementById('world-threshold')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
};
```

Replace the current campfire fragment:

```tsx
<>
  <WorldEncounterPanel />
  <FullMeasureView ... />
</>
```

with:

```tsx
<>
  <HumanTerminalPanel
    lastResidueRef={lastWorldResidue?.residueRef}
    onBeginCrossing={handleBeginWorldCrossing}
  />
  <WorldEncounterPanel onResidue={setLastWorldResidue} />
  <FullMeasureView
    offers={offers}
    projects={projects}
    receipts={receipts}
    capacities={capacities}
    events={events}
    onNavigate={handleTabChange}
    onSelectProject={(id) => setSelectedProjectId(id)}
    onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
    currentUser={currentUser}
  />
</>
```

Do not persist `lastWorldResidue` to localStorage, database, server API, or a new event store. It is a session convenience pointing back to the exact canonical residue ref.

- [ ] **Step 5: Run the mounting tests to verify GREEN**

Run:

```bash
node --import tsx --test tests/world-encounter-panel.test.ts tests/app-human-terminal.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 6: Run the existing Garden interaction unit tests**

Run:

```bash
node --import tsx --test \
  tests/garden-encounter.test.ts \
  tests/garden-selection.test.ts \
  tests/garden-traversal.test.ts \
  tests/world-encounter-panel.test.ts
```

Expected: PASS. No gesture/candidate/confirmation semantics changed.

- [ ] **Step 7: Commit the session binding**

```bash
git add src/App.tsx src/components/WorldEncounterPanel.tsx tests/app-human-terminal.test.ts tests/world-encounter-panel.test.ts
git commit -m "feat: bind Human Terminal to Garden session"
```

---

### Task 5: Verify the constitutional negative space and full repository gate

**Files:**
- Modify only if verification finds an actual defect in Tasks 1–4.
- No new feature scope in this task.

**Interfaces:**
- Confirms the first Human Terminal slice adds no server routes and no mutation path from freeform text.
- Confirms the existing Boot the House runtime remains the only crossing implementation.

- [ ] **Step 1: Run all Human Terminal tests together**

Run:

```bash
node --import tsx --test \
  tests/human-terminal-interpret.test.ts \
  tests/human-terminal-operator.test.ts \
  tests/human-terminal-panel.test.ts \
  tests/app-human-terminal.test.ts
```

Expected: PASS, all Human Terminal tests green.

- [ ] **Step 2: Prove the Human Terminal implementation has no forbidden execution imports/calls**

Run:

```bash
grep -RInE "child_process|exec\(|spawn\(|prepareEncounter|confirmEncounter|tranchnodeAdapter|project0Adapter|corpusAdapter" \
  src/lib/humanTerminal src/components/HumanTerminalPanel.tsx
```

Expected: no output and exit status 1 from `grep` because none of the forbidden strings occur.

Then run:

```bash
grep -RIn "worldRuntimeClient\|createWorldRuntimeClient" src/lib/humanTerminal src/components/HumanTerminalPanel.tsx
```

Expected: the operator imports/uses the existing world-runtime client; the UI imports the Human Terminal operator, not donor adapters.

- [ ] **Step 3: Prove no server route was added**

Run the existing exact client route test:

```bash
node --import tsx --test tests/world-runtime-client.test.ts
```

Expected: PASS with the existing six mounted world-runtime routes only.

Also run:

```bash
git diff main...HEAD -- src/lib/worldRuntime/routes.ts server.ts
```

Expected: no diff.

- [ ] **Step 4: Run the full repository gate**

Run:

```bash
npm run check
```

Expected:

```text
npm run lint   -> exit 0
npm test       -> exit 0
npm run build  -> exit 0
```

Do not claim completion from partial tests if this command fails.

- [ ] **Step 5: Inspect the final diff for scope drift**

Run:

```bash
git status -sb
git diff --stat main...HEAD
git diff main...HEAD -- \
  src/lib/humanTerminal \
  src/components/HumanTerminalPanel.tsx \
  src/components/WorldEncounterPanel.tsx \
  src/App.tsx \
  tests/human-terminal-interpret.test.ts \
  tests/human-terminal-operator.test.ts \
  tests/human-terminal-panel.test.ts \
  tests/app-human-terminal.test.ts \
  tests/world-encounter-panel.test.ts
```

Expected scope:

```text
CREATE src/lib/humanTerminal/types.ts
CREATE src/lib/humanTerminal/interpret.ts
CREATE src/lib/humanTerminal/operator.ts
CREATE src/components/HumanTerminalPanel.tsx
MODIFY src/components/WorldEncounterPanel.tsx
MODIFY src/App.tsx
CREATE tests/human-terminal-interpret.test.ts
CREATE tests/human-terminal-operator.test.ts
CREATE tests/human-terminal-panel.test.ts
CREATE tests/app-human-terminal.test.ts
MODIFY tests/world-encounter-panel.test.ts
```

Any change to `server.ts`, donor adapters, world-runtime routes, process adapters, or package dependencies is a stop condition requiring review.

- [ ] **Step 6: Commit any verification-only repair, otherwise leave history unchanged**

If and only if Steps 1–5 exposed a real implementation defect and the repair is within this plan, commit it explicitly:

```bash
git add <exact repaired files>
git commit -m "fix: preserve Human Terminal boundary"
```

If no repair was needed, do not create an empty commit.

---

## Plan Self-Review

### Spec coverage

- Basic-human contextual commands: Tasks 1 and 3.
- Bounded known intents only: Task 1.
- Unknown input fails closed: Tasks 1 and 5.
- Existing Full Measure seams only: Task 2.
- No donor direct calls: Tasks 2 and 5.
- Suggestion carries no authority: Tasks 1–3.
- Fixture/live/reachability truth: Task 2.
- Evidence remains inspectable: Tasks 2–3.
- Residue outcome classes remain distinct: Task 2.
- “What happened last time?” uses exact current-session residue ref, not narrative memory: Task 4.
- Garden remains the only crossing surface: Tasks 2 and 4.
- Crossing suggestion cannot prepare/confirm: Tasks 2 and 5.
- No new server route/state/credentials/canonicalization: Tasks 4–5.
- Full repository regression gate: Task 5.

### Placeholder scan

No `TBD`, `TODO`, “similar to”, undefined later work, or vague “add handling” steps remain. Every planned production file, test file, command, expected failure/pass state, and commit boundary is named.

### Type consistency

- `HumanTerminalKnownIntent` is the single known-intent union consumed by interpreter, operator, and panel.
- `HumanTerminalMove.intent` always carries a `HumanTerminalKnownIntent`.
- `begin-crossing` is the only intent that may produce `handoff.kind === 'garden-crossing'`.
- `WorldEncounterPanel.onResidue` carries the existing exact `WorldEncounterResidue` type.
- `App.lastWorldResidue` stores that same type and passes only `.residueRef` into the Terminal.
- No second residue shape is introduced.

## Completion Boundary

This plan completes the first Human Terminal v0.1 interface slice when the user can open Full Measure and see a terminal-like basic-human front door above the Garden, use bounded contextual commands to inspect field/doors/evidence/current-session residue, receive fail-closed behavior for unknown language, and hand off a crossing request to the existing Garden without the Terminal gaining mutation authority.

It intentionally does **not** implement model-based natural-language interpretation, Founder Node live discovery, arbitrary CLI execution, GitHub operations, persistent terminal history, autonomous traversal, or a replacement crossing flow.
