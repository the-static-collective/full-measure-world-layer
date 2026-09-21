import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 GRACE_ORIGIN_WORLD_MANIFEST, inspectGraceCandidate, previewGraceTransfer,
} from '../specimens/grace-001/originEntry.ts';

const HASH='sha256:'+'a'.repeat(64);
const sourceAddress={worldId:'full-measure/grace-001',sourceSystem:'the-static-collective/full-measure-world-layer',sourceBranch:'feature/grace-001-worldseed',sourceCommit:'df1f20702012cd4e14a279e05d1a47a8255a40b9',sourceSchema:'full-measure.grace-worldseed.v0',sourcePath:'specimens/grace-001/worldseed.json',claimScope:'developer-source-pointer-only'};
const gate=()=>({gateId:HASH,sourceWorldRef:'foreign-room-seed-001',destinationWorldRef:'full-measure/grace-001',status:'DETECTED',authorized:false,admissionStatus:'UNREQUESTED',reportedLocalEventRef:HASH,priorCrossingRef:HASH,sourceAddress,unresolvedConditions:['grace-owned-world-manifest','grace-owned-entry-policy','foreign-room-exit-policy','party-confirmation'],nonClaims:['not_a_grace_world_invitation','not_a_destination_admission']});
const item=(ref:string,sourceSystem='foreign-room-seed-001',claimScope='reference-only',requestedMode='reference')=>({ref,sourceSystem,claimScope,requestedMode,evidenceRef:HASH});
const items=()=>[
 item('human:fixture:human-1','static-field/worldseed-001','participant-ref'),
 item('card:first-inheritance','postemahhn','card-reference-not-physical-custody'),
 item('thread:bell-unresolved','static-field/worldseed-001','unresolved-thread-only'),
 item('static-field:charge','static-field/worldseed-001','source-local-capacity','carry'),
 item('static-field:resonance-interpretation','static-field/worldseed-001','interpretation-not-fact'),
 item('static-field:porch','static-field/worldseed-001','reported-origin-place','reconstitute'),
 item('private:memory','static-field/worldseed-001','private-knowledge-not-consented','withhold'),
 item('model:local-grant','static-field/worldseed-001','source-local-model-capability','withhold'),
];
const proposal=()=>({schema:'origin.transfer-preview-request.v0.1',sourceWorldRef:'foreign-room-seed-001',proposedDestinationRef:'full-measure/grace-001',partyRef:'fixture:party-1',anchorRef:'card:first-inheritance',priorCrossingRef:HASH,items:items()});

test('published JSON World Manifest stays identical to Grace-owned policy declaration',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../specimens/grace-001/origin.world-manifest.v0.1.json',import.meta.url),'utf8'));
 assert.deepEqual(manifest,GRACE_ORIGIN_WORLD_MANIFEST);
});
test('Grace declares its own world and explicitly does not enable a live gate',()=>{
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.worldId,'full-measure/grace-001');
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.status,'experimental-fixture-policy-only');
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.localCampaignSchema,'full-measure.grace-session.v1');
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.authority,'grace-world-local');
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.entryPolicyRef,'full-measure/grace-001/entry-policy-v0.1');
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.liveAdapterEnabled,false);
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.adapterKind,'grace-origin-entry-policy-only');
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.authorityPolicyRef,'full-measure/grace-001/local-authorship');
 assert.equal(GRACE_ORIGIN_WORLD_MANIFEST.memoryPolicyRef,'minimum-reference-only');
 assert.deepEqual(GRACE_ORIGIN_WORLD_MANIFEST.declaredCapabilities,[]);
 assert.deepEqual(GRACE_ORIGIN_WORLD_MANIFEST.knownGateRefs,[]);
});
test('reported address is eligible for inspection, never an invitation',()=>{
 const receipt=inspectGraceCandidate(gate());
 assert.equal(receipt.status,'ADDRESS_RECOGNIZED_ONLY');
 assert.equal(receipt.admitted,false);
 assert.equal(receipt.candidateGateRef,HASH);
 assert.ok(receipt.unresolvedConditions.includes('grace-local-host-consent'));
 assert.ok(receipt.nonClaims.includes('not_a_destination_admission'));
});
test('not-yet-detected and falsely authorized gates are refused for inspection',()=>{
 assert.throws(()=>inspectGraceCandidate({...gate(),status:'OFFERED'}),/DETECTED_GATE_REQUIRED/);
 assert.throws(()=>inspectGraceCandidate({...gate(),authorized:true}),/UNAUTHORIZED_GATE_CLAIM/);
 assert.throws(()=>inspectGraceCandidate({...gate(),admissionStatus:'ADMITTED'}),/UNAUTHORIZED_GATE_CLAIM/);
});
test('forged or different-world addresses cannot impersonate Grace',()=>{
 assert.throws(()=>inspectGraceCandidate({...gate(),destinationWorldRef:'different-world'}),/DESTINATION_MISMATCH/);
 assert.throws(()=>inspectGraceCandidate({...gate(),sourceAddress:{...sourceAddress,claimScope:'verified-live-entry'}}),/ADDRESS_SCOPE_INVALID/);
 assert.throws(()=>inspectGraceCandidate({...gate(),sourceAddress:{...sourceAddress,sourcePath:'specimens/grace-001/fake.json'}}),/ADDRESS_SCOPE_INVALID/);
});
test('an inspection does not mutate incoming gate data',()=>{
 const g=gate();const copy=structuredClone(g);inspectGraceCandidate(g);assert.deepEqual(g,copy);
});
test('preview respects the full eight-item mixed transfer without admitting anybody',()=>{
 const p=previewGraceTransfer(gate(),proposal());
 assert.equal(p.status,'HOLD');assert.equal(p.admitted,false);
 assert.equal(p.manifestRef,GRACE_ORIGIN_WORLD_MANIFEST.worldId);
 assert.equal(p.items.length,8);
 assert.equal(p.items.find(x=>x.ref==='human:fixture:human-1')?.disposition,'HOLD_PERSON_CONSENT');
 assert.equal(p.items.find(x=>x.ref==='card:first-inheritance')?.disposition,'REFERENCE_ELIGIBLE');
 assert.equal(p.items.find(x=>x.ref==='thread:bell-unresolved')?.disposition,'REFERENCE_ELIGIBLE');
 assert.equal(p.items.find(x=>x.ref==='static-field:charge')?.disposition,'REFUSE');
 assert.equal(p.items.find(x=>x.ref==='static-field:resonance-interpretation')?.disposition,'HOLD');
 assert.equal(p.items.find(x=>x.ref==='static-field:porch')?.disposition,'TRANSFORM_ON_ADMISSION');
 assert.equal(p.items.find(x=>x.ref==='private:memory')?.disposition,'WITHHOLD');
 assert.equal(p.items.find(x=>x.ref==='model:local-grant')?.disposition,'WITHHOLD');
 assert.ok(p.nonClaims.includes('does_not_change_grace_campaign_state'));
});
test('unknown item is held rather than silently imported',()=>{
 const request=proposal();request.items.push(item('unknown:magic-crown'));
 const p=previewGraceTransfer(gate(),request);
 assert.equal(p.items.at(-1)?.disposition,'HOLD_UNDECLARED');
});
test('source-local Charge stays refused even when request says reference',()=>{
 const request=proposal();request.items[3].requestedMode='reference';
 const p=previewGraceTransfer(gate(),request);
 assert.equal(p.items[3].disposition,'REFUSE');
});
test('private memory and model grants never leak their contents into a preview',()=>{
 const request=proposal();request.items[6]={...request.items[6],payload:'secret'} as any;
 assert.throws(()=>previewGraceTransfer(gate(),request),/UNDECLARED_ITEM_FIELDS/);
 const p=previewGraceTransfer(gate(),proposal());
 assert.equal(JSON.stringify(p).includes('secret'),false);
});
test('no manifest, party, and crossing identity mismatch may pass',()=>{
 for(const patch of [{proposedDestinationRef:'a-wrong-world'},{sourceWorldRef:'static-field/worldseed-001'},{partyRef:''},{priorCrossingRef:'not-a-receipt'},{anchorRef:''}]){
 assert.throws(()=>previewGraceTransfer(gate(),{...proposal(),...patch}),/MISMATCH|INVALID/);
 }
});
test('duplicate items and incompatible claim scopes fail closed',()=>{
 const request=proposal();request.items.push({...request.items[0]});
 assert.throws(()=>previewGraceTransfer(gate(),request),/DUPLICATE_ITEM/);
 const bad=proposal();bad.items[1].claimScope='physical-custody-certified';
 assert.equal(previewGraceTransfer(gate(),bad).items[1].disposition,'HOLD_UNDECLARED');
});
test('a forged source offer and local consent fields cannot force admission',()=>{
 const request=proposal();assert.throws(()=>previewGraceTransfer(gate(),{...request,sourceOfferRef:HASH,graceConsent:true}),/UNDECLARED_REQUEST_FIELDS/);
});
test('two previews are deterministic and leave the source unchanged',()=>{
 const g=gate();const req=proposal();const before=structuredClone(req);const a=previewGraceTransfer(g,req);const b=previewGraceTransfer(g,req);assert.deepEqual(a,b);assert.deepEqual(req,before);
});
