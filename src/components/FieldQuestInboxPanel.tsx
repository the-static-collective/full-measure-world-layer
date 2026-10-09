import React, { useMemo, useState } from 'react';
import { Compass, Copy, Eye, FlaskConical, PauseCircle, RotateCcw } from 'lucide-react';
import { FIELD_TEST_INBOX } from '../lib/fieldQuestInbox';
import { decideQuest, drawQuestCards, projectGardenDraft } from '../lib/fieldQuestEngine';
import type { QuestDisposition } from '../lib/fieldQuestEngine';

interface Props { onOpenGarden: () => void }

/**
 * Experimental project proposals only. Existing Garden commands/witness flow
 * remain the only path to contributed Deeds and capacity.
 */
export const FieldQuestInboxPanel: React.FC<Props> = ({ onOpenGarden }) => {
  const cards = useMemo(() => drawQuestCards(FIELD_TEST_INBOX), []);
  const [choices, setChoices] = useState<Record<string, QuestDisposition>>({});
  const [message, setMessage] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const choose = (id: string, disposition: QuestDisposition) => {
    const card = cards.find(item => item.quest_id === id);
    if (!card) return;
    try {
      decideQuest(card, disposition);
      setChoices(previous => ({ ...previous, [id]: disposition }));
      setDraftId(disposition === 'ACCEPT' ? id : null);
      setMessage(disposition === 'ACCEPT'
        ? 'Selected for possible Garden proposal. No pledge or Deed was created.'
        : disposition + ' — local choice only; no change to Garden records.');
    } catch {
      setMessage('Prerequisite unresolved. A separate human-reviewed field result is required.');
    }
  };
  const copy = async (id: string) => {
    const card = cards.find(item => item.quest_id === id);
    if (!card || choices[id] !== 'ACCEPT') return;
    try {
      const proposal = projectGardenDraft(card);
      await navigator.clipboard.writeText(
        [proposal.title, proposal.story, 'Materials: ' + proposal.needs.join(', '),
          'Return: ' + proposal.return_condition, 'Provenance: ' + proposal.provenance].join('\n\n')
      );
      setMessage('Draft copied. Open the Garden and explicitly create or join a real project to continue.');
    } catch {
      setMessage('Clipboard unavailable. No proposal was sent.');
    }
  };

  return (
    <section className="parchment-card rounded-3xl p-5 sm:p-6 space-y-4" aria-labelledby="field-quests-heading">
      <div className="flex items-center gap-3">
        <FlaskConical className="w-6 h-6 text-emerald-800" aria-hidden="true" />
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-stone-600 uppercase">FIELD QUEST ENGINE · 001 · SOURCE-OWNED TESTS</p>
          <h3 className="font-serif-warm text-2xl font-bold" id="field-quests-heading">The Physical Test Inbox</h3>
        </div>
      </div>
      <p className="text-sm text-stone-700 leading-relaxed">
        Unfinished experiments can offer optional quests. Technical outcomes belong to their
        source laboratory; an actual Full Measure Deed still requires the existing human witness.
        These cards are public candidates only, not published Circle projects.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {cards.map(card => (
          <article key={card.quest_id} className="rounded-2xl border border-[#e2d7c7] p-4 bg-[#fcfaf6] space-y-3">
            <div className="text-[10px] uppercase tracking-wide font-bold text-amber-900">
              {card.source.scale.replace('_', ' ')} · {card.eligible_to_propose ? 'Field test available' : 'Needs prior witness'}
            </div>
            <h4 className="font-serif-warm text-lg font-bold">{card.source.title}</h4>
            <p className="text-xs text-stone-700 leading-relaxed">{card.source.question}</p>
            <p className="text-[11px] text-stone-600">
              <strong>Return evidence:</strong> {card.source.return_evidence.join(' · ')}
            </p>
            <p className="text-[11px] text-stone-600">
              <strong>Safety:</strong> {card.source.safety_boundaries.join(' · ')}
            </p>
            <p className="text-[10px] text-stone-500 break-all">
              {card.source.source_repository}@{card.source.source_commit.slice(0, 12)}
            </p>
            <div className="flex gap-2 flex-wrap" aria-label={card.source.title + ' options'}>
              {card.eligible_to_propose && <button className="rounded-xl bg-emerald-900 text-white px-3 py-2 text-xs" onClick={() => choose(card.quest_id, 'ACCEPT')}>Select as proposal</button>}
              <button className="rounded-xl border px-3 py-2 text-xs" onClick={() => choose(card.quest_id, 'HOLD')}><PauseCircle className="inline w-3 h-3 mr-1" />Hold</button>
              <button className="rounded-xl border px-3 py-2 text-xs" onClick={() => choose(card.quest_id, 'REST')}><RotateCcw className="inline w-3 h-3 mr-1" />Rest</button>
              <button className="rounded-xl border px-3 py-2 text-xs" onClick={() => choose(card.quest_id, 'LEAVE_OPEN')}>Leave open</button>
            </div>
            {choices[card.quest_id] && <p className="text-[11px] text-emerald-800" aria-live="polite">Local choice: {choices[card.quest_id]}. Not a pledge, test verdict, or Deed.</p>}
            {draftId === card.quest_id && (
              <div className="flex gap-2 flex-wrap border-t pt-3">
                <button className="rounded-xl border px-3 py-2 text-xs" onClick={() => void copy(card.quest_id)}><Copy className="inline w-3 h-3 mr-1" />Copy Garden draft</button>
                <button className="rounded-xl border px-3 py-2 text-xs" onClick={onOpenGarden}><Compass className="inline w-3 h-3 mr-1" />Open Garden</button>
              </div>
            )}
            <a className="text-[11px] underline text-emerald-800" href={`https://github.com/${card.source.source_repository}/blob/${card.source.source_commit}/${card.source.source_path}`} target="_blank" rel="noreferrer"><Eye className="inline w-3 h-3 mr-1" />Inspect original test instructions</a>
          </article>
        ))}
      </div>
      <p className="text-xs text-stone-600" role="status">{message || 'Nothing selected. Ignoring an invitation creates no record.'}</p>
      <p className="text-[11px] text-stone-500">PROPOSAL ≠ PLEDGE · ATTEMPT ≠ TECHNICAL PASS · SELF-REPORT ≠ HUMAN WITNESS · WITNESS ≠ HUMAN WORTH</p>
    </section>
  );
};
