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
    lines.push('Project0 validation failed before destination invocation; the destination was not invoked.');
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
              'Authority: none. Visibility does not grant permission.',
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
