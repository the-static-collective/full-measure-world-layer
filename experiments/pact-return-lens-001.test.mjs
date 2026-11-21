import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { assessPactReturn } from './pact-return-lens-001.mjs';

const room='11111111-1111-4111-8111-111111111111';
const id='22222222-2222-4222-8222-222222222222';
const digest = ({title='Synthetic volunteer shift',proof='Shift report'}) =>
  createHash('sha256').update(JSON.stringify([
    'static-collective.pact.subject.v1',room,id,title,'you','1 hour','', 'you','you',proof
  ]),'utf8').digest('hex');
function specimen(mode='observed') {
 const hash=digest({});
 const events=[
  {sequence:1,id:'event1',type:'quest.create',actor:'you',at:'2026-11-21T01:00:00Z',data:{id,title:'Synthetic volunteer shift',owner:'you',notes:'1 hour',due:'',category:'OTHER',xp:25}},
  {sequence:2,id:'event2',type:'quest.submit',actor:'you',at:'2026-11-21T02:00:00Z',data:{id,proof:'Shift report',subjectDigest:hash}},
  {sequence:3,id:'event3',type:'quest.verify',actor:'paula',at:'2026-11-21T02:10:00Z',data:{id,subjectDigest:hash,mode,note:'I reviewed this'}} ,
  {sequence:4,id:'event4',type:'impact.report',actor:'you',at:'2026-11-21T02:15:00Z',data:{id,before:'Unserved',after:'Task report returned',beneficiary:'Test group'}},
  {sequence:5,id:'event5',type:'impact.review',actor:'paula',at:'2026-11-21T02:20:00Z',data:{id,mode:'reviewed',note:'Not recipient-confirmed'}}
 ];
 return {schema:'static-collective.pact-world-review.v1',source:{project:'THE PACT / planZ',room},
  subject:{questId:id,title:'Synthetic volunteer shift',owner:'you',notes:'1 hour',reportedBy:'you',proof:'Shift report',sha256:hash},
  humanEncounter:{peer:'paula',basis:mode,note:'I reviewed this',at:'2026-11-21T02:10:00Z'},
  candidateImpact:{before:'Unserved',after:'Task report returned',beneficiary:'Test group'},
  events,awards:{Deeds:0,Harvests:0,Capacity:0}};
}
function inspect(mutator) {const p=specimen();mutator(p);return assessPactReturn(p)}
function hold(r){assert.equal(r.status,'HOLD');assert.deepEqual(r.awards,{Deeds:0,Harvests:0,Capacity:0});assert.equal(r.admitted,false)}
test('consistent candidate enters review, not the canonical world',()=>{
 const r=assessPactReturn(specimen());assert.equal(r.status,'REVIEW_CANDIDATE');assert.deepEqual(r.issues,[]);
 assert.equal(r.admitted,false);assert.equal(r.authority,'NONE');assert.deepEqual(r.awards,{Deeds:0,Harvests:0,Capacity:0});
});
test('trust-based peer confirmation is not independent evidence or Deed',()=>{
 const r=assessPactReturn(specimen('trusted'));assert.equal(r.status,'REVIEW_CANDIDATE');
 assert.equal(r.provenance.witnessBasis,'trusted');assert.equal(r.awards.Deeds,0);
});
test('tampered submitted proof cannot masquerade as bound subject',()=>{
 const r=inspect(p=>p.events[1].data.proof='Tampered');hold(r);assert.ok(r.issues.includes('SUBJECT_DIGEST_MISMATCH'));
});
test('self-witness fails',()=>{
 const r=inspect(p=>p.events[2].actor='you');hold(r);assert.ok(r.issues.includes('INVALID_PEER_WITNESS'));
});
test('reopen invalidates active consequence projection without erasing lineage',()=>{
 const r=inspect(p=>p.events.push({sequence:6,type:'quest.reopen',actor:'paula',data:{id}}));hold(r);
 assert.ok(r.issues.includes('QUEST_NOT_PEER_CONFIRMED'));
});
test('a claimant cannot review their own consequence',()=>{
 const r=inspect(p=>p.events[4].actor='you');hold(r);assert.ok(r.issues.includes('INVALID_IMPACT_PEER_REVIEW'));
});
test('a locally claimed positive award is refused',()=>{
 const r=inspect(p=>p.awards.Deeds=1);hold(r);assert.ok(r.issues.includes('AWARD_CLAIM_NOT_ZERO'));
});
test('no consequence claim means no Full Measure return candidate',()=>{
 const r=inspect(p=>{p.events.splice(3,2);p.candidateImpact=null});hold(r);assert.ok(r.issues.includes('NO_CONSEQUENCE_CLAIM'));
});
