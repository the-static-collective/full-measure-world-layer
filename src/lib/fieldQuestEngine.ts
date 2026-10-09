/**
 * FIELD-QUEST-ENGINE-001 — Full Measure's proposal-only physical-test inbox.
 * Source laboratories own technical verdicts; the existing Garden owns pledges and
 * human-confirmed Deeds. This module emits neither DomainEvents nor receipts.
 */
export type QuestScale = 'SPARK' | 'QUEST' | 'PARTY_ARC';
export type TestCondition = 'READY_FOR_FIELD_TEST' | 'NEEDS_PRIOR_WITNESS';
export type QuestDisposition = 'ACCEPT' | 'HOLD' | 'LEAVE_OPEN' | 'REST';
export type ReportFinding = 'OBSERVED_PASS' | 'OBSERVED_FAIL' | 'INCONCLUSIVE';

export interface FieldTestEntry {
  schema: 'static.field-test-entry/v0';
  id: string;
  source_project: string;
  source_repository: string;
  source_commit: string;
  source_path: string;
  source_gate: string;
  title: string;
  question: string;
  scale: QuestScale;
  required_materials: string[];
  procedure: string[];
  safety_boundaries: string[];
  return_evidence: string[];
  condition: TestCondition;
  condition_ref: string | null;
  possible_descendant: string;
  status: 'PHYSICAL_UNVERIFIED';
  provenance_note: string;
}

export interface FieldTestInbox {
  schema: 'static.field-test-inbox/v0';
  entries: FieldTestEntry[];
}
export interface QuestCard {
  schema: 'full-measure.field-quest-card/v0';
  quest_id: string;
  source: FieldTestEntry;
  invitation: true;
  local_disposition: 'UNDECIDED';
  eligible_to_propose: boolean;
  truth_state: 'PROPOSAL';
  participation_state: 'NOT_PLEDGED';
  deed_state: 'NOT_AWARDED';
  technical_verdict: 'NOT_DETERMINED';
}
export interface LocalQuestChoice {
  schema: 'full-measure.field-quest-choice/v0';
  quest_id: string;
  source_commit: string;
  disposition: QuestDisposition;
  scope: 'LOCAL_PROPOSAL_ONLY';
  technical_verdict: 'NOT_DETERMINED';
  deed_state: 'NOT_AWARDED';
}
export interface FieldReport {
  schema: 'full-measure.field-report-proposal/v0';
  quest_id: string;
  source_commit: string;
  finding: ReportFinding;
  evidence_sha256: string;
  observation_note: string;
  reported_status: 'UNWITNESSED_SELF_REPORT';
  technical_verdict: 'NOT_DETERMINED';
  deed_state: 'NOT_AWARDED';
}

const slug = /^[a-z0-9][a-z0-9-]{2,79}$/;
const sha = /^[0-9a-f]{40}$/;
const fingerprint = /^sha256:[a-f0-9]{64}$/;
const bounds = (v: unknown, max = 1024): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;
function assertPlain(v: unknown): asserts v is Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.getPrototypeOf(v) !== Object.prototype)
    throw Error('INVALID_FIELD_OBJECT');
}
function keys(v: Record<string, unknown>, expected: readonly string[]): void {
  const actual = Object.keys(v).sort();
  if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) throw Error('UNEXPECTED_FIELD_KEYS');
}
function stringList(v: unknown, min = 1, max = 12): asserts v is string[] {
  if (!Array.isArray(v) || v.length < min || v.length > max ||
    v.some(item => !bounds(item, 240))) throw Error('INVALID_FIELD_LIST');
}
const ENTRY_KEYS = ['schema', 'id', 'source_project', 'source_repository', 'source_commit',
  'source_path', 'source_gate', 'title', 'question', 'scale', 'required_materials', 'procedure',
  'safety_boundaries', 'return_evidence', 'condition', 'condition_ref',
  'possible_descendant', 'status', 'provenance_note'];

export function verifyFieldTestInbox(value: unknown): FieldTestInbox {
  assertPlain(value);
  keys(value, ['schema', 'entries']);
  if (value.schema !== 'static.field-test-inbox/v0' || !Array.isArray(value.entries) ||
    value.entries.length < 1 || value.entries.length > 32) throw Error('INVALID_FIELD_INBOX');
  const ids = new Set<string>();
  for (const raw of value.entries) {
    assertPlain(raw); keys(raw, ENTRY_KEYS);
    if (raw.schema !== 'static.field-test-entry/v0' || typeof raw.id !== 'string' ||
      !slug.test(raw.id) || ids.has(raw.id)) throw Error('INVALID_FIELD_ENTRY_ID');
    ids.add(raw.id);
    for (const field of ['source_project','source_repository','source_path','source_gate',
      'title','question','possible_descendant','provenance_note'])
      if (!bounds(raw[field], field === 'question' ? 800 : 240)) throw Error('INVALID_FIELD_ENTRY_TEXT');
    if (!sha.test(String(raw.source_commit))) throw Error('INVALID_SOURCE_REVISION');
    for (const key of ['required_materials','procedure','safety_boundaries','return_evidence'])
      stringList(raw[key]);
    if (!['SPARK','QUEST','PARTY_ARC'].includes(String(raw.scale)) ||
      !['READY_FOR_FIELD_TEST','NEEDS_PRIOR_WITNESS'].includes(String(raw.condition)) ||
      raw.status !== 'PHYSICAL_UNVERIFIED') throw Error('INVALID_FIELD_TRUTH');
    if (raw.condition === 'NEEDS_PRIOR_WITNESS' && !bounds(raw.condition_ref)) throw Error('MISSING_WITNESS_PREREQUISITE');
    if (raw.condition === 'READY_FOR_FIELD_TEST' && raw.condition_ref !== null) throw Error('UNEXPECTED_PREREQUISITE');
  }
  return structuredClone(value) as unknown as FieldTestInbox;
}

export function drawQuestCards(inbox: unknown): QuestCard[] {
  const verified = verifyFieldTestInbox(inbox);
  return verified.entries.map(entry => ({
    schema: 'full-measure.field-quest-card/v0',
    quest_id: entry.id,
    source: entry,
    invitation: true,
    local_disposition: 'UNDECIDED',
    eligible_to_propose: entry.condition === 'READY_FOR_FIELD_TEST',
    truth_state: 'PROPOSAL',
    participation_state: 'NOT_PLEDGED',
    deed_state: 'NOT_AWARDED',
    technical_verdict: 'NOT_DETERMINED',
  }));
}

/** Opt-in choice only. Does not touch the existing Full Measure ledger. */
export function decideQuest(card: QuestCard, disposition: QuestDisposition): LocalQuestChoice {
  if (card.schema !== 'full-measure.field-quest-card/v0' ||
    !['ACCEPT','HOLD','LEAVE_OPEN','REST'].includes(disposition)) throw Error('INVALID_QUEST_CHOICE');
  if (disposition === 'ACCEPT' && !card.eligible_to_propose) throw Error('QUEST_PREREQUISITE_UNWITNESSED');
  return {
    schema: 'full-measure.field-quest-choice/v0',
    quest_id: card.quest_id,
    source_commit: card.source.source_commit,
    disposition,
    scope: 'LOCAL_PROPOSAL_ONLY',
    technical_verdict: 'NOT_DETERMINED',
    deed_state: 'NOT_AWARDED',
  };
}

/** A local report is never technical success nor a human-confirmed Deed. */
export function proposeFieldReport(
  card: QuestCard, finding: ReportFinding, evidenceSha256: string, note: string
): FieldReport {
  if (!['OBSERVED_PASS','OBSERVED_FAIL','INCONCLUSIVE'].includes(finding) ||
    !fingerprint.test(evidenceSha256) || !bounds(note, 1000)) throw Error('INVALID_FIELD_REPORT');
  return {
    schema: 'full-measure.field-report-proposal/v0',
    quest_id: card.quest_id,
    source_commit: card.source.source_commit,
    finding, evidence_sha256: evidenceSha256, observation_note: note,
    reported_status: 'UNWITNESSED_SELF_REPORT',
    technical_verdict: 'NOT_DETERMINED',
    deed_state: 'NOT_AWARDED',
  };
}

export function projectGardenDraft(card: QuestCard): {
  title: string; story: string; needs: string[]; return_condition: string; provenance: string;
} {
  if (!card.eligible_to_propose) throw Error('QUEST_PREREQUISITE_UNWITNESSED');
  return {
    title: card.source.title,
    story: card.source.question + '\n\nCandidate only; independent witness is still required. ' + card.source.provenance_note,
    needs: [...card.source.required_materials],
    return_condition: card.source.return_evidence.join('; '),
    provenance: card.source.source_repository + '@' + card.source.source_commit + ':' + card.source.source_path,
  };
}
