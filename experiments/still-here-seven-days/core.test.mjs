import test from 'node:test';
import assert from 'node:assert/strict';
import {DAYS,AREAS,TIMES,fresh,normalize,nextDay,record,summary} from './core.mjs';
test('seven steps, deliberate rest, and bounded capacity',()=>{
 let state=fresh();
 for(let d=1;d<=7;d++){assert.equal(nextDay(state),d);state=record(state,{area:'care',minutes:2,kind:d%2?'tended':'rested'});}
 assert.deepEqual(summary(state),{total:7,tended:4,rested:3,areas:['care']});
 assert.equal(nextDay(state),8);
 assert.throws(()=>record(state,{area:'care',minutes:2,kind:'tended'}));
});
test('local records reject invalid fields and strip unexpected metadata',()=>{
 assert.deepEqual(normalize({version:1,entries:[{day:2,area:'care',minutes:2,kind:'tended'}]}),fresh());
 assert.deepEqual(normalize({version:1,entries:[{day:1,area:'care',minutes:2,kind:'tended',personal:'discard'}]}).entries[0],{day:1,area:'care',minutes:2,kind:'tended'});
 for(const choice of [{area:'private_story',minutes:2,kind:'tended'},{area:'care',minutes:100,kind:'tended'},{area:'care',minutes:2,kind:'unverified'}]) assert.throws(()=>record(fresh(),choice));
});
test('finite, noncoercive care options',()=>{
 assert.equal(DAYS.length,7);
 assert.equal(Object.keys(AREAS).length,4);
 assert.deepEqual(TIMES,[2,5,15]);
});
