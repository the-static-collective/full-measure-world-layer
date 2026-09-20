import test from 'node:test';
import assert from 'node:assert/strict';
import { projectClockworkMap, type OccurrenceRef, type MapProjection } from '../src/lib/clockworkMap';
const event:OccurrenceRef={occurrenceId:'fixture:event',sourceRef:'fixture:receipt',occurredUtc:'2026-09-20T12:00:00Z'};
const p=(axis:MapProjection['axis'],id:string):MapProjection=>({projectionId:id,occurrenceId:event.occurrenceId,
  axis,methodRef:'fixture:method',sourceRef:'fixture:source',displayLabel:'fixture label'});
test('one occurrence supports distinct independently sourced navigational projections',()=>{
 const before=projectClockworkMap(event,[p('time','time:a'),p('narrative','story:a')]);
 assert.equal(before.layers.time[0].occurrenceId,before.layers.narrative[0].occurrenceId);
 assert.equal(before.layers.place.length,0);
 assert.equal(before.occurrence.sourceRef,'fixture:receipt');
 assert.equal(before.layers.narrative[0].axis,'narrative');
});
test('rejects incompatible source occurrence and duplicate projection identity',()=>{
 assert.throws(()=>projectClockworkMap(event,[{...p('place','p'),occurrenceId:'fixture:other'}]),/does not refer/);
 assert.throws(()=>projectClockworkMap(event,[p('time','p'),p('relation','p')]),/duplicate/);
});
test('projection creates no world event or authority claim',()=>{
 const m=projectClockworkMap(event,[]);
 assert.deepEqual(m.layers,{time:[],place:[],relation:[],narrative:[]});
 assert.match(m.nonClaims.join(' '),/does not admit a Deed/);
});
