import test from 'node:test';
import assert from 'node:assert/strict';
import {assessCommonsReturn} from '../src/lib/commonsReturnLens.js';
import type {CommonsPlanReturnSummary,CommonsTransportObservation} from '../src/lib/commonsReturnLens.js';
const packet:CommonsPlanReturnSummary={
 schema:'planz.return-candidate/v0',
 candidateId:'planz-return-v0:'+'f'.repeat(64),
 planId:'GLOBAL-CROSSING-001',
 sourceIssue:'https://github.com/the-static-collective/BananaSpork/issues/29',
 disposition:'HOLD_FOR_OWNER_REVIEW',fieldVerified:false,
 sourceOwnerApproved:false,recipientConfirmed:false,
 sentExternally:false,authority:'NONE',
};
function transport(status:CommonsTransportObservation['status']):CommonsTransportObservation {
 return {schema:'relatte.evidence-transit-result/v0',
 crossing_id:'relatte-crossing-v0:'+'a'.repeat(64),
 receive_receipt_id:'relatte-receipt-v0:'+'b'.repeat(64),
 disposition_receipt_id:'relatte-receipt-v0:'+'c'.repeat(64),status};
}
test('no reLATTE receipt means no counted Deed, Harvest or Capacity',()=>{
 const x=assessCommonsReturn(packet);
 assert.equal(x.stage,'HELD');
 assert.equal(x.transport,'NOT_RECEIVED');
 assert.equal(x.deedsGranted+x.harvestsGranted+x.capacitiesGranted,0);
 assert.equal(x.fieldVerified,false);
});
test('even a receiver ADMIT or replay can only make a reviewable observation',()=>{
 for(const status of ['STORED','ALREADY_STORED'] as const){
  const x=assessCommonsReturn(packet,transport(status));
  assert.equal(x.stage,'REVIEWABLE_CANDIDATE');
  assert.equal(x.deedsGranted,0);assert.equal(x.harvestsGranted,0);
  assert.equal(x.capacitiesGranted,0);assert.equal(x.fieldVerified,false);
  assert.match(x.nextHumanGate,/recipient confirmation/);
 }
});
test('signed HOLD, source refusal and revoked-policy BLOCKED never yield capacity',()=>{
 for(const status of ['HELD','REFUSED','BLOCKED'] as const){
  const x=assessCommonsReturn(packet,transport(status));
  assert.equal(x.capacitiesGranted,0);assert.equal(x.deedsGranted,0);
  assert.equal(x.stage,status==='REFUSED'?'REFUSED':'HELD');
 }
});
test('false claim of recipient receipt, owner approval or field verification rejected',()=>{
 for(const p of [
   {...packet,fieldVerified:true},
   {...packet,sourceOwnerApproved:true},
   {...packet,recipientConfirmed:true},
   {...packet,authority:'ROOT'},
   {...packet,sourceIssue:'https://evil.invalid/x'},
 ])assert.throws(()=>assessCommonsReturn(p as any),/refuses/);
});
test('bad transport identity or altered summary cannot be treated as admission',()=>{
 assert.throws(()=>assessCommonsReturn(packet,{...transport('STORED'),crossing_id:'bad'}),/Invalid/);
 assert.throws(()=>assessCommonsReturn(packet,{...transport('STORED'),status:'COMPLETED' as any}),/Invalid/);
});
