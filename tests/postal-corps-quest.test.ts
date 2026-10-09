import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  choosePostalEncounter, inspectPostalCorpsImport, postalGardenDraft,
} from '../src/lib/postalCorpsQuest';

const hist='a'.repeat(64), parcel='e'.repeat(64), id='route-specimen-001';
function sample(){
  return {
    source:'LEMONPRESS_NATIVE_DISPATCH_001',
    source_dispatch_state:'service_selected',
    route_state:'WORK_REVIEW_READY',
    full_measure:{
      schema:'full-measure.postal-quest-draft/v0',route_id:id,
      parcel_sha256:parcel,status:'LOCAL_PROPOSAL_ONLY',
      eligible_for_human_review:true,self_reported:'YES',human_claims_present:true,
      deed_state:'NOT_AWARDED',official_full_measure_event_created:false,
      history_sha256:hist,
    },
    penny:{
      schema:'jubilee.penny-postal-work-proposal-only/v0',route_id:id,
      candidate_work_payloads:[1,2].map(i=>({
        workId:'postal-'+id+'-leg-'+i,
        holderId:'person:synthetic-carrier'+i,
        quantity:1,termsRef:'terms:illustrative-carriage-not-compensation',
        evidenceHash:hist,completedAt:'2026-10-09T19:00:00.000Z',
      })),
      work_witness_proof:null,status:'NO_TREASURY_EVENT',
      book_coins:0,released_units:0,active_units:0,
      real_payment_occurred:false,human_wage_agreement:false,ledger_touched:false,
      history_sha256:hist,
    },
    private_addresses_in_output:false,real_postage_acquired:false,
    physical_delivery_claimed:false,
  };
}
const clone=<T>(v:T):T=>structuredClone(v);

test('an independent GHoT proposal is inspectable, not a native Deed or PENNY reward',()=>{
  const view=inspectPostalCorpsImport(sample());
  assert.equal(view.source_attestation,'EXTERNAL_UNVERIFIED_IMPORT');
  assert.equal(view.deed_state,'NOT_AWARDED');
  assert.equal(view.penny_released_units,0);
  assert.equal(view.penny_book_coins,0);
  assert.equal(view.compensation_state,'NOT_AGREED_OR_SETTLED');
  assert.equal(view.possible_next_door,'OPT_IN_GARDEN_DRAFT');
  const draft=postalGardenDraft(view);
  assert.match(draft.provenance,/GHoT:POSTAL-CORPS-001/);
  assert.ok(!('deed_id' in draft));
  assert.ok(!('amount' in draft));
});

test('rest, hold and leave open never compel service or create events',()=>{
  const view=inspectPostalCorpsImport(sample());
  for(const decision of ['REST','HOLD','LEAVE_OPEN'] as const){
    const local=choosePostalEncounter(view,decision);
    assert.equal(local.consequence,'LOCAL_PREVIEW_ONLY');
    assert.equal(local.deed_state,'NOT_AWARDED');
  }
});

test('refusal or dispute cannot offer a completed Garden draft',()=>{
  for(const state of ['REFUSED','REFUSED_AT_RELAY','LOSS_REPORTED','DISPUTED']){
    const proposal=sample();
    proposal.route_state=state;
    proposal.full_measure.eligible_for_human_review=false;
    proposal.full_measure.human_claims_present=false;
    proposal.full_measure.self_reported='NOT_COMPLETE';
    proposal.penny.candidate_work_payloads=[];
    const view=inspectPostalCorpsImport(proposal);
    assert.equal(view.possible_next_door,'HOLD_OR_REFUSE');
    assert.throws(()=>postalGardenDraft(view),/NOT_READY/);
  }
});

test('forged native Deed or unlocked PENNY fields fail closed',()=>{
  const a=sample() as any;
  a.full_measure.deed_state='AWARDED';
  assert.throws(()=>inspectPostalCorpsImport(a),/CANNOT_CLAIM_DEED/);
  const b=sample() as any;b.penny.active_units=2;
  assert.throws(()=>inspectPostalCorpsImport(b),/CANNOT_GRANT_PENNY/);
  const c=sample() as any;c.penny.work_witness_proof={signature:'FAKE'};
  assert.throws(()=>inspectPostalCorpsImport(c),/CANNOT_GRANT_PENNY/);
  const d=sample() as any;d.real_postage_acquired=true;
  assert.throws(()=>inspectPostalCorpsImport(d),/UNPAID_FIXTURE/);
});

test('private address sidecar is not allowed into public quest preview',()=>{
  const a=sample() as any;a.address='123 Main Street';
  assert.throws(()=>inspectPostalCorpsImport(a),/UNEXPECTED_POSTAL_FIELDS/);
  const b=sample() as any;b.penny.secret_account='hush';
  assert.throws(()=>inspectPostalCorpsImport(b),/UNEXPECTED_POSTAL_FIELDS/);
  const c=sample() as any;c.private_addresses_in_output=true;
  assert.throws(()=>inspectPostalCorpsImport(c),/UNPAID_FIXTURE/);
});

test('source and PENNY must bind identical route and history',()=>{
  const a=sample();a.penny.route_id='route-other';
  assert.throws(()=>inspectPostalCorpsImport(a),/CANNOT_GRANT_PENNY/);
  const b=sample();b.penny.history_sha256='c'.repeat(64);
  assert.throws(()=>inspectPostalCorpsImport(b),/INCONSISTENT_HISTORY/);
  const c=sample();c.penny.candidate_work_payloads[1].evidenceHash='c'.repeat(64);
  assert.throws(()=>inspectPostalCorpsImport(c),/UNSUPPORTED_POSTAL_WORK_PROJECTION/);
});

test('two partial or unsigned handoffs are not a completed review',()=>{
  const a=sample();a.full_measure.eligible_for_human_review=false;
  a.penny.candidate_work_payloads=[];
  const view=inspectPostalCorpsImport(a);
  assert.equal(view.eligible_for_review,false);
  assert.throws(()=>choosePostalEncounter(view,'PREVIEW_GARDEN_DRAFT'),/NOT_READY/);
});

test('a real pinned GHoT + LemonPRESS simulation payload remains unadmitted',()=>{
  const path=process.env.POSTAL_CORPS_NATIVE_PROPOSAL;
  if(!path) return;
  const fixture=JSON.parse(readFileSync(path,'utf8'));
  const view=inspectPostalCorpsImport(fixture);
  assert.equal(view.route_id,'route-specimen-001');
  assert.equal(view.source_attestation,'EXTERNAL_UNVERIFIED_IMPORT');
  assert.equal(view.eligible_for_review,true);
  assert.equal(view.deed_state,'NOT_AWARDED');
  assert.equal(view.penny_released_units,0);
});
