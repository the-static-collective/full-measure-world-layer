import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { openWarmThread, authorizeStep, attemptStep, refuseStep, exportWarmThreadResidue } from '../warm-thread.mjs';

function fixture(){
  return {
    format:'ghot.warm-thread-proposal',version:1,authority:'proposal-only',externalAuthority:'none',sourceVerification:'self-declared-inputs-unverified',status:'composable',missing_relations:[],source_record_ids:['can-cut-001','can-haul-001','have-tree-001','need-heat-001'],
    economics:{required:false,settlement:null,orientation:'optional-after-useful-path',universal_total:null},
    privacy:{exact_household_address:'withheld',minimum_necessary_release:true},
    nonclaims:{physical_existence_verified:false,ownership_verified:false,safety_verified:false,human_identity_verified:false,execution_authorized:false},
    laws:['CAPACITY != OBLIGATION'],
    thread:{have:'have-tree-001',can_cut:'can-cut-001',can_haul:'can-haul-001',need:'need-heat-001',locality:['neighborhood-a'],time_windows:['today','16:00-18:00','17:00-19:00','tonight']},
    steps:[
      {step_id:'release-tree',kind:'release-resource',actor:'alice',subject:'fallen-ash-tree',requested_effect:'release-for-firewood-chain',authorization:'required-separately',consumes_future_authority:false},
      {step_id:'cut-tree',kind:'transform-resource',actor:'bob',subject:'fallen-ash-tree',requested_effect:'dead-tree-to-cut-firewood',authorization:'required-separately',consumes_future_authority:false},
      {step_id:'haul-load',kind:'transport-resource',actor:'cara',subject:'cut-firewood',requested_effect:'move-one-load-within-declared-radius',authorization:'required-separately',consumes_future_authority:false},
      {step_id:'accept-delivery',kind:'accept-resource',actor:'david',subject:'one-firewood-load',requested_effect:'accept-firewood-for-home-heat',authorization:'required-separately',consumes_future_authority:false},
    ],
    requested_effect:{operation:'consider-warm-thread',automatic_execution_requested:false,automatic_location_release_requested:false,automatic_settlement_requested:false},
    warm_thread_id:'warm-thread:test'
  };
}

function succeed(world, stepId, actor){
  return attemptStep(authorizeStep(world, stepId, actor, 'ACT'), stepId, actor, 'SUCCEEDED');
}

test('opens proposal as local possibility, not authority',()=>{
  const world=openWarmThread(fixture());
  assert.equal(world.ok,true);
  assert.equal(world.need.status,'open');
  assert.equal(world.sharedWorldChanged,false);
  assert.equal(world.humanWorthJudgment,null);
  assert.equal(world.nextStep,'release-tree');
});

test('source overclaims and economic collapse refuse',()=>{
  for(const mutate of [
    x=>x.requested_effect.automatic_execution_requested=true,
    x=>x.privacy.exact_household_address='123 Secret St',
    x=>x.price=20,
    x=>x.nonclaims.ownership_verified=true,
  ]){
    const value=fixture(); mutate(value);
    assert.equal(openWarmThread(value).ok,false);
  }
});

test('each human step requires fresh local ACT',()=>{
  let world=openWarmThread(fixture());
  const alice=authorizeStep(world,'release-tree','alice','ACT');
  assert.equal(attemptStep(alice,'cut-tree','bob','SUCCEEDED').code,'wrong-step');
  world=attemptStep(alice,'release-tree','alice','SUCCEEDED');
  assert.equal(attemptStep(world,'cut-tree','bob','SUCCEEDED').code,'authorization-required');
  assert.equal(authorizeStep(world,'cut-tree','alice','ACT').code,'wrong-actor');
  world=succeed(world,'cut-tree','bob');
  assert.equal(world.resources.cutter.minutesAvailable,0);
  assert.equal(world.need.status,'open');
});

test('full successful path consumes finite capacity and resolves one need',()=>{
  let world=openWarmThread(fixture());
  world=succeed(world,'release-tree','alice');
  world=succeed(world,'cut-tree','bob');
  world=succeed(world,'haul-load','cara');
  world=succeed(world,'accept-delivery','david');
  assert.equal(world.phase,'completed');
  assert.equal(world.need.status,'met-for-this-load');
  assert.equal(world.resources.cutter.minutesAvailable,0);
  assert.equal(world.resources.truck.loadsAvailable,0);
  assert.equal(world.resources.firewood.state,'accepted-for-home-heat');
  assert.equal(exportWarmThreadResidue(world).unresolvedRelation,null);
});

test('refusal becomes residue without scoring the person',()=>{
  let world=openWarmThread(fixture());
  world=succeed(world,'release-tree','alice');
  world=succeed(world,'cut-tree','bob');
  world=refuseStep(world,'haul-load','cara','truck unavailable after all');
  assert.equal(world.phase,'held-residual');
  assert.equal(world.need.status,'open');
  assert.equal(world.resources.firewood.state,'cut-at-source');
  const residue=exportWarmThreadResidue(world);
  assert.equal(residue.unresolvedRelation,'haul-firewood');
  assert.equal(residue.humanWorthJudgment,null);
  assert.equal(residue.score,null);
  assert.equal(residue.residue.at(-1).outcome,'REFUSED');
});

test('failed authorized attempt is not silently retried',()=>{
  let world=openWarmThread(fixture());
  world=succeed(world,'release-tree','alice');
  const authorized=authorizeStep(world,'cut-tree','bob','ACT');
  world=attemptStep(authorized,'cut-tree','bob','FAILED');
  assert.equal(world.phase,'held-residual');
  assert.equal(attemptStep(world,'cut-tree','bob','SUCCEEDED').code,'held-residual');
  assert.equal(world.need.status,'open');
});

test('real GHoT producer branch emits a proposal this world can receive',()=>{
  const dir=process.env.GHOT_WARM_THREAD_DIR;
  if(!dir) return;
  const run=spawnSync('python3',[resolve(dir,'ghot/warm_thread.py'),'proposal'],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const world=openWarmThread(run.stdout);
  assert.equal(world.ok,true,JSON.stringify(world));
  assert.equal(world.sourceProposal.warm_thread_id.startsWith('warm-thread:'),true);
});
