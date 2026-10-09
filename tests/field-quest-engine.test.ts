import test from 'node:test';
import assert from 'node:assert/strict';
import { FIELD_TEST_INBOX } from '../src/lib/fieldQuestInbox';
import { decideQuest, drawQuestCards, projectGardenDraft, proposeFieldReport, verifyFieldTestInbox } from '../src/lib/fieldQuestEngine';

test('source-pinned SKYMIRROR backlog becomes opt-in proposals, not Deeds', () => {
  const cards=drawQuestCards(FIELD_TEST_INBOX);
  assert.equal(cards.length,2);
  assert.equal(cards[0].eligible_to_propose,true);
  assert.equal(cards[1].eligible_to_propose,false);
  for(const c of cards){
    assert.equal(c.participation_state,'NOT_PLEDGED');
    assert.equal(c.technical_verdict,'NOT_DETERMINED');
    assert.equal(c.deed_state,'NOT_AWARDED');
    assert.equal(c.truth_state,'PROPOSAL');
  }
  assert.equal(FIELD_TEST_INBOX.entries[0].status,'PHYSICAL_UNVERIFIED');
});

test('hold, rest and leave open do not mutate Garden stats or force acceptance', () => {
  const card=drawQuestCards(FIELD_TEST_INBOX)[0];
  for(const disposition of ['HOLD','REST','LEAVE_OPEN','ACCEPT'] as const){
    const event=decideQuest(card,disposition);
    assert.equal(event.scope,'LOCAL_PROPOSAL_ONLY');
    assert.equal(event.deed_state,'NOT_AWARDED');
    assert.equal(event.technical_verdict,'NOT_DETERMINED');
  }
  assert.equal(card.local_disposition,'UNDECIDED');
  assert.throws(()=>decideQuest(drawQuestCards(FIELD_TEST_INBOX)[1],'ACCEPT'),/PREREQUISITE/);
});

test('the same draft can be proposed to the ordinary Garden; no duplicate parallel ledger', () => {
  const draft=projectGardenDraft(drawQuestCards(FIELD_TEST_INBOX)[0]);
  assert.equal(draft.title,'The First Light Crossing');
  assert.match(draft.provenance,/540da481/);
  assert.ok(!('deed' in draft));
  assert.throws(()=>projectGardenDraft(drawQuestCards(FIELD_TEST_INBOX)[1]),/PREREQUISITE/);
});

test('an honestly failed attempt remains an unwitnessed report, not a technical verdict', () => {
  const card=drawQuestCards(FIELD_TEST_INBOX)[0];
  for(const finding of ['OBSERVED_PASS','OBSERVED_FAIL','INCONCLUSIVE'] as const){
    const result=proposeFieldReport(card,finding,'sha256:'+'a'.repeat(64),'Raw trial available for review.');
    assert.equal(result.reported_status,'UNWITNESSED_SELF_REPORT');
    assert.equal(result.deed_state,'NOT_AWARDED');
    assert.equal(result.technical_verdict,'NOT_DETERMINED');
  }
  assert.throws(()=>proposeFieldReport(card,'OBSERVED_PASS','sha256:bad','note'),/INVALID_FIELD_REPORT/);
});

test('unknown fields, forged technical pass, duplicate IDs, invalid source and private sidecars reject',()=>{
  const template=structuredClone(FIELD_TEST_INBOX);
  assert.deepEqual(verifyFieldTestInbox(template),template);
  const fake=structuredClone(template) as any;
  fake.entries[0].status='FIELD_PASSED';
  assert.throws(()=>verifyFieldTestInbox(fake),/INVALID_FIELD_TRUTH/);
  const extra=structuredClone(template) as any;
  extra.entries[0].private_key='do not ingest';
  assert.throws(()=>verifyFieldTestInbox(extra),/UNEXPECTED_FIELD_KEYS/);
  const bad=structuredClone(template) as any;
  bad.entries[0].source_commit='main';
  assert.throws(()=>verifyFieldTestInbox(bad),/INVALID_SOURCE_REVISION/);
  const dup=structuredClone(template) as any;
  dup.entries[1].id=dup.entries[0].id;
  assert.throws(()=>verifyFieldTestInbox(dup),/INVALID_FIELD_ENTRY_ID/);
  assert.equal(FIELD_TEST_INBOX.entries[0].status,'PHYSICAL_UNVERIFIED');
});
