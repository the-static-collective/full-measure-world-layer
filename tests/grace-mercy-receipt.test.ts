import test from 'node:test';
import assert from 'node:assert/strict';
import type { DomainEvent } from '../src/types.js';
import { buildGraceMercyProjection } from '../src/lib/graceMercy/projection.js';
import { applyBrokenPromiseAction, type BrokenPromiseAction, MercyTransitionError } from '../src/lib/graceMercy/brokenPromise.js';
import { buildMercyEncounterReceipt, validateMercyReceipt } from '../src/lib/graceMercy/receipt.js';

const ACTIONS: readonly BrokenPromiseAction[] = ['NOTICE_RUPTURE','TURN_TO_MERCY','NAME_OCCURRENCE','TEST_PATTERN','WITNESS_CONSEQUENCE','BOUND_COMMITMENT','DISCERN_REFUSE','CLOSE_ENCOUNTER'];

function history(prefix='e'): DomainEvent[] {
  const characterRef='user_grace';
  const encounterId='grace-mercy:broken-promise-001:user_grace';
  const events: DomainEvent[]=[];
  ACTIONS.forEach((action,index)=>{
    const projection=buildGraceMercyProjection(characterRef,encounterId,events);
    events.push(applyBrokenPromiseAction({projection,action,actorId:characterRef,circleId:'circle_1',eventId:`${prefix}${index+1}`,occurredAt:`2026-09-21T11:${String(index).padStart(2,'0')}:00.000Z`}));
  });
  return events;
}

test('REFUSE receipt preserves bounded claims and explicit non-claims', () => {
  const events=history();
  const projection=buildGraceMercyProjection('user_grace','grace-mercy:broken-promise-001:user_grace',events);
  const receipt=buildMercyEncounterReceipt(projection);
  assert.equal(receipt.startingSheet,'GRACE');
  assert.equal(receipt.discernment,'REFUSE');
  assert.equal(receipt.disposition,'BOUNDED');
  assert.equal(receipt.endingSheet,'MERCY');
  assert.ok(receipt.unknowns.includes('intent_unknown'));
  assert.deepEqual(receipt.boundaries,['commitment:renew-under-same-conditions']);
  assert.match(receipt.receiptHash,/^sha256:[0-9a-f]{64}$/);
  for (const claim of ['does_not_establish_motive','does_not_diagnose_person','does_not_establish_moral_worth','does_not_establish_divine_interpretation','does_not_restore_relationship','does_not_remove_consequence']) assert.ok(receipt.nonClaims.includes(claim));
  assert.equal(validateMercyReceipt(receipt).valid,true);
});

test('same ordered history yields same receipt hash', () => {
  const a=buildGraceMercyProjection('user_grace','grace-mercy:broken-promise-001:user_grace',history());
  const b=buildGraceMercyProjection('user_grace','grace-mercy:broken-promise-001:user_grace',history());
  assert.equal(buildMercyEncounterReceipt(a).receiptHash,buildMercyEncounterReceipt(b).receiptHash);
});

test('distinct occurrence ids remain distinct receipt histories', () => {
  const a=buildGraceMercyProjection('user_grace','grace-mercy:broken-promise-001:user_grace',history('a'));
  const b=buildGraceMercyProjection('user_grace','grace-mercy:broken-promise-001:user_grace',history('b'));
  assert.notEqual(buildMercyEncounterReceipt(a).receiptHash,buildMercyEncounterReceipt(b).receiptHash);
});

test('duplicate event ids are rejected', () => {
  const events=history();
  events.push({...events[0]});
  const projection=buildGraceMercyProjection('user_grace','grace-mercy:broken-promise-001:user_grace',events);
  assert.throws(()=>buildMercyEncounterReceipt(projection),/DUPLICATE_EVENT_ID/);
});

test('a second discernment cannot be appended after REFUSE', () => {
  const events=history().slice(0,-1);
  const projection=buildGraceMercyProjection('user_grace','grace-mercy:broken-promise-001:user_grace',events);
  assert.throws(()=>applyBrokenPromiseAction({projection,action:'DISCERN_HOLD',actorId:'user_grace',circleId:'circle_1',eventId:'dupe',occurredAt:'2026-09-21T12:00:00Z'}),(error:any)=>error instanceof MercyTransitionError && error.code==='ACTION_ALREADY_APPLIED');
});
