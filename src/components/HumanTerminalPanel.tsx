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

export function HumanTerminalPanel({ lastResidueRef, onBeginCrossing }: Props = {}) {
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
    if (interpretation.recognized === false) {
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
