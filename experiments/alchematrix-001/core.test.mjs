import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,step,benchCapabilities,WORLD} from './core.mjs';
const doStep=(s,type,fields={})=>step(s,{type,...fields});
const mine=(s,item,n=1)=>Array.from({length:n}).reduce(x=>doStep(x,'mine',{item}),s);
function prepared(){let s=initialState();s=mine(s,'quartz',2);s=mine(s,'copper',2);s=mine(s,'echo');s=doStep(s,'craft-telescope');s=doStep(s,'install-probe');s=doStep(s,'install-memory');s=doStep(s,'observe',{target:'prismA'});s=doStep(s,'observe',{target:'prismB'});return s;}
test('the fictional source world remains immutable through the entire craft',()=>{const before=JSON.stringify(WORLD);let s=prepared();s=doStep(s,'socket-telescope');s=doStep(s,'craft-question-key');s=doStep(s,'open-door');assert.equal(JSON.stringify(WORLD),before);assert.ok(s.doorOpen);});
test('an unupgraded bench cannot craft a key',()=>assert.throws(()=>doStep(initialState(),'craft-question-key'),/lacks/));
test('bare sight cannot distinguish or retain history',()=>{let s=mine(mine(initialState(),'quartz'),'copper');s=doStep(s,'craft-telescope');s=doStep(s,'observe',{target:'prismA'});assert.deepEqual(s.observations,{});assert.match(s.last,/indistinguishable/);});
test('probe without memory is not a historical receipt',()=>{let s=initialState();s=mine(s,'quartz',2);s=mine(s,'copper',2);s=doStep(s,'craft-telescope');s=doStep(s,'install-probe');s=doStep(s,'observe',{target:'prismA'});assert.deepEqual(s.observations,{});});
test('the second composer gains capabilities only after a witnessed socket',()=>{let s=prepared();assert.deepEqual(benchCapabilities(s),[]);s=doStep(s,'socket-telescope');assert.deepEqual(benchCapabilities(s),['frequency-probe','memory-receipt','sight']);assert.equal(s.telescope,null);s=doStep(s,'craft-question-key');assert.equal(s.artifact.dependsOn.length,3);});
test('failed actions never mutate the original state',()=>{const s=initialState();assert.throws(()=>doStep(s,'open-door'),/Question Key/);assert.throws(()=>doStep(s,'mine',{item:'infinite-power'}),/Unknown ore/);assert.equal(s.events.length,0);});
test('each occurrence and composed artifact retains distinct IDs',()=>{let s=prepared();assert.equal(new Set(s.events.map(e=>e.id)).size,s.events.length);s=doStep(s,'socket-telescope');s=doStep(s,'craft-question-key');assert.notEqual(s.artifact.id,s.artifact.dependsOn[0]);});
