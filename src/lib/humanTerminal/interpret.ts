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
