import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectGraceSourceExitOffer,previewGraceSourceExitOffer} from '../specimens/grace-001/originEntry.ts';

const source=JSON.parse(readFileSync(new URL('../specimens/grace-001/fixtures/origin-foreign-room-exit-003.json',import.meta.url),'utf8'));
const inputs=()=>structuredClone(source);

test('real Origin fixture source envelope is recognized without granting Grace entry',()=>{
 const {candidateGate,exitOffer}=inputs();
 const result=inspectGraceSourceExitOffer(candidateGate,exitOffer);
 assert.equal(result.status,'SOURCE_OFFER_SHAPE_RECOGNIZED');
 assert.equal(result.admitted,false);
 assert.equal(result.sourceIntegrity,'UNVERIFIED_BY_DESTINATION');
 assert.equal(result.sourceOfferRef,exitOffer.receiptId);
 assert.equal(result.sourceLocalReceiptRef,exitOffer.sourceLocalReceiptRef);
 assert.equal(result.priorCrossingRef,candidateGate.priorCrossingRef);
 assert.ok(result.unresolvedConditions.includes('source-offer-integrity-verification'));
 assert.ok(result.unresolvedConditions.includes('grace-local-host-consent'));
});
test('Grace remains HOLD after an actual source-shaped offer; every item remains a proposal',()=>{
 const {candidateGate,exitOffer}=inputs();
 const before=JSON.stringify({candidateGate,exitOffer});
 const result=previewGraceSourceExitOffer(candidateGate,exitOffer);
 assert.equal(result.admitted,false);assert.equal(result.status,'HOLD');
 assert.equal(result.sourceOfferRef,exitOffer.receiptId);
 assert.equal(result.sourceOfferStatus,'SOURCE_OFFER_SHAPE_RECOGNIZED');
 assert.equal(result.items.length,4);
 assert.equal(result.items.find(x=>x.ref==='human:fixture:human-1')?.disposition,'HOLD_PERSON_CONSENT');
 assert.equal(result.items.find(x=>x.ref==='card:first-inheritance')?.disposition,'REFERENCE_ELIGIBLE');
 assert.equal(result.items.find(x=>x.ref==='thread:bell-unresolved')?.disposition,'REFERENCE_ELIGIBLE');
 assert.equal(result.items.find(x=>x.ref==='foreign-room:reported-origin/porch')?.disposition,'HOLD_UNDECLARED');
 assert.equal(JSON.stringify({candidateGate,exitOffer}),before);
 assert.ok(result.nonClaims.includes('not_a_cryptographic_verification_of_any_external_receipt'));
});
test('a bare address cannot substitute for a Foreign Room source offer',()=>{
 const {candidateGate}=inputs();
 assert.throws(()=>inspectGraceSourceExitOffer(candidateGate,null),/SOURCE_OFFER_REQUIRED/);
});
test('a forged offer cannot claim admission, host consent or a changed destination',()=>{
 const {candidateGate,exitOffer}=inputs();
 for(const changes of [{admitted:true},{status:'ADMITTED'},{destinationWorldRef:'different-world'},{hostConsent:true},{sourceStatus:'live-verified'}]){
  assert.throws(()=>inspectGraceSourceExitOffer(candidateGate,{...exitOffer,...changes}),/SOURCE_OFFER_/);
 }
});
test('crossing, Gate, party and Anchor mismatches fail closed',()=>{
 const {candidateGate,exitOffer}=inputs();
 for(const changes of [{candidateGateRef:'sha256:'+'f'.repeat(64)},{priorCrossingRef:'sha256:'+'f'.repeat(64)},{partyRef:'another-party'},{anchorRef:'another-anchor'},{sourceLocalReceiptRef:'invented'}]){
  assert.throws(()=>inspectGraceSourceExitOffer(candidateGate,{...exitOffer,...changes}),/SOURCE_OFFER_/);
 }
});
test('source bundle must match envelope and remain narrow; no private payload',()=>{
 const {candidateGate,exitOffer}=inputs();
 for(const itemChange of [
   {...exitOffer.transferBundle,partyRef:'attacker'},
   {...exitOffer.transferBundle,priorCrossingRef:'sha256:'+'b'.repeat(64)},
   {...exitOffer.transferBundle,items:[...exitOffer.transferBundle.items,{ref:'private:memory',sourceSystem:'foreign-room-seed-001',claimScope:'private',requestedMode:'carry',evidenceRef:exitOffer.priorCrossingRef}]}
 ]) assert.throws(()=>previewGraceSourceExitOffer(candidateGate,{...exitOffer,transferBundle:itemChange}),/SOURCE_OFFER_/);
});
test('altering an unverified hash shape is rejected, but a correctly shaped hash does not certify provenance',()=>{
 const {candidateGate,exitOffer}=inputs();
 assert.throws(()=>inspectGraceSourceExitOffer(candidateGate,{...exitOffer,receiptId:'not-a-hash'}),/SOURCE_OFFER_/);
 const fake={...exitOffer,receiptId:'sha256:'+'f'.repeat(64)};
 const result=inspectGraceSourceExitOffer(candidateGate,fake);
 assert.equal(result.sourceIntegrity,'UNVERIFIED_BY_DESTINATION');
 assert.equal(result.admitted,false);
});
