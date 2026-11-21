import test from 'node:test';
import assert from 'node:assert/strict';
import {assessWitnessAudioReturn} from './witness-audio-return-001.mjs';
const id='18a764d8-53c5-4ae9-b76b-743725f1fe7b',room='f5de5671-63dd-4578-8fed-4d2be7b2ba86';
const hash='a'.repeat(64);
function packet(){
 const at='2026-11-21T01:20:00Z';
 return {schema:'static-collective.witness-pact-full-measure-candidate.v1',
  source:{project:'WITNESS community audio Bible',room,bridge:'THE PACT v0.4'},
  recording:{recordingId:'recording-synthetic-001',sha256:hash,passage:'matthew.5.1',edition:'engwebp',declaredLicense:'contributor-permission-local-prototype'},
  bridge:{linkedBy:'you',withdrawn:false,peerReports:[{actor:'paula',mode:'heard',note:'I listened',at}]},
  events:[
   {seq:1,actor:'you',at:'2026-11-21T01:15:00Z',type:'witness.link',data:{id,recordingId:'recording-synthetic-001',hash,passage:'matthew.5.1',edition:'engwebp'}},
   {seq:2,actor:'paula',at,type:'witness.review',data:{id,mode:'heard',note:'I listened'}}
  ],awards:{Deeds:0,Harvests:0,Capacity:0}};
}
const inspect=mutate=>{const p=packet();mutate(p);return assessWitnessAudioReturn(p);};
const hold=r=>{assert.equal(r.status,'HOLD');assert.equal(r.admitted,false);assert.deepEqual(r.awards,{Deeds:0,Harvests:0,Capacity:0});};
test('properly formed listening report may enter review but never awards',()=>{
 const r=assessWitnessAudioReturn(packet());assert.equal(r.status,'REVIEW_CANDIDATE');assert.equal(r.authority,'NONE');assert.deepEqual(r.awards,{Deeds:0,Harvests:0,Capacity:0});
});
test('self-listening witness cannot review own link',()=>{const r=inspect(p=>{p.events[1].actor='you';p.bridge.peerReports[0].actor='you'});hold(r);assert.ok(r.issues.includes('INVALID_PEER_REVIEW'));});
test('metadata acknowledgment does not claim actual listening',()=>{const r=inspect(p=>{p.events[1].data.mode='metadata';p.bridge.peerReports[0].mode='metadata'});hold(r);assert.ok(r.issues.includes('NO_INDEPENDENT_LISTENING_REPORT'));});
test('withdrawal invalidates prospective review',()=>{const r=inspect(p=>{p.bridge.withdrawn=true;p.events.push({seq:3,actor:'you',type:'witness.withdraw',data:{id}})});hold(r);assert.ok(r.issues.includes('WITHDRAWN_REFERENCE'));});
test('different audio hash held',()=>{const r=inspect(p=>{p.recording.sha256='b'.repeat(64)});hold(r);assert.ok(r.issues.includes('RECORDING_REF_CONFLICT'));});
test('claimed Deeds held',()=>{const r=inspect(p=>{p.awards.Deeds=1});hold(r);assert.ok(r.issues.includes('FOREIGN_AWARD_CLAIM'));});
test('missing text edition held',()=>{const r=inspect(p=>{p.recording.edition=''});hold(r);assert.ok(r.issues.includes('MISSING_PASSAGE_OR_EDITION'));});
test('duplicate review held',()=>{const r=inspect(p=>{p.events.push({...p.events[1],seq:3})});hold(r);assert.ok(r.issues.includes('INVALID_PEER_REVIEW'));});
