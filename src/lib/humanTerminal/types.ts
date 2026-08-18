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
