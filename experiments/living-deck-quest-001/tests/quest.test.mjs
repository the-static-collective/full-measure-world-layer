import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { openQuestHandoff,takeQuestAction,exportQuestPreview,createRoomRequest } from "../quest.mjs";

const id="pc001:cicada:echo:radio";
const source={repository:"the-static-collective/Jubilee-Engine-VM",commit:"20b529038be86cb88e2fd386536493cd694fd719",sourceCardStatus:"specified-not-issued",proofOfPhysicalCard:false,proofOfStickerIssuance:false};
function fixture(){
 return {format:"static-field.living-deck-portable-proposal",version:1,status:"unverified-proposal",
  sourceVerification:"unavailable",sourceCardReceipts:null,sourceStickerReceipt:null,externalAuthority:"none",
  sourceDesign:source,selection:{firstId:"cicada",secondId:"radio",stickerId:"echo"},
  compositionReceipt:{id,schema:"static-field.postemahhn-composition-preview.v0",orderedCardRefs:["fixture:cicada","fixture:radio"],stickerRef:"fixture:echo",authority:"none",status:"proposed",acceptedIntoSharedWorld:false,provenance:{origin:"local-demo-fixture",verifiedExternalCardIdentity:false,importedPostEmahhnReceipt:null}},
  fullMeasure:{format:"full-measure.project-draft-proposal/0.1",status:"proposal",notAProjectRecord:true,sourceCardProof:null,title:"Cicada and Radio",story:"The cicada sings",needs:[{title:"Find the rhythm",status:"open"}]},
  roroomom:{format:"static-room-source-handoff",object:{id},sourceEvidence:{issuedCardProof:null}}};
}
test("candidate opens as held local quest, never real project",()=>{
 const q=openQuestHandoff(JSON.stringify(fixture()));
 assert.equal(q.ok,true);
 assert.equal(q.projectCreated,false);
 assert.equal(q.pledgeConfirmed,false);
 assert.equal(q.localDisposition,"held");
 assert.equal(q.sharedWorldChanged,false);
});
test("join/attempt/report are local and never become a confirmed deed",()=>{
 const start=openQuestHandoff(fixture());
 assert.equal(takeQuestAction(start,"JOIN").code,"inspect-first");
 assert.equal(takeQuestAction(start,"REPORT").code,"attempt-first");
 const inspected=takeQuestAction(start,"INSPECT");
 const joined=takeQuestAction(inspected,"JOIN");
 const attempted=takeQuestAction(joined,"ATTEMPT");
 const reported=takeQuestAction(attempted,"REPORT");
 assert.equal(reported.phase,"reported-unconfirmed");
 assert.equal(reported.pledgeConfirmed,false);
 assert.equal(start.localTrace.length,0);
 const receipt=exportQuestPreview(reported);
 assert.equal(receipt.pledgeConfirmationRef,null);
 assert.equal(receipt.sharedWorldChanged,false);
 const room=createRoomRequest(reported);
 assert.equal(room.format,"full-measure.living-deck-room-request");
 assert.equal(room.questPreviewReceipt.sourceCompositionId,id);
 assert.equal(room.grant,"preview-only");
});
test("hold/return/refuse remain explicit and preserve local trace",()=>{
 const first=openQuestHandoff(fixture());
 const held=takeQuestAction(first,"HOLD");
 assert.equal(takeQuestAction(held,"JOIN").code,"held");
 const returned=takeQuestAction(held,"RETURN");
 const refused=takeQuestAction(returned,"REFUSE");
 assert.deepEqual(refused.localTrace,["HOLD","RETURN","REFUSE"]);
 assert.equal(takeQuestAction(refused,"INSPECT").code,"refused");
});
test("self-authenticated cards, forged projects, wrong order, bad rooms refuse",()=>{
 const mutations=[
 x=>x.sourceCardReceipts=[{verified:true}],
 x=>x.sourceDesign.proofOfPhysicalCard=true,
 x=>x.fullMeasure.status="open",
 x=>x.fullMeasure.notAProjectRecord=false,
 x=>x.selection.firstId="radio",
 x=>x.compositionReceipt.id="forged",
 x=>x.roroomom.object.id="bad",
 x=>x.roroomom.sourceEvidence.issuedCardProof={verified:true}
 ];
 for(const mut of mutations){const x=JSON.parse(JSON.stringify(fixture()));mut(x);assert.equal(openQuestHandoff(x).ok,false,JSON.stringify(x))}
});
test("real producer branch exports a quest that the Full Measure consumer can receive",async(t)=>{
 const dir=process.env.STATIC_FIELD_DECK_DIR;
 if(!dir){t.skip("Set STATIC_FIELD_DECK_DIR to the Static Field checkout");return}
 const {buildBrowserHandoff}=await import(pathToFileURL(resolve(dir,"experiments/postemahhn-living-deck-001/browser-handoff.mjs")).href);
 const handoff=buildBrowserHandoff({firstId:"cicada",secondId:"radio",stickerId:"echo"});
 const q=openQuestHandoff(JSON.stringify(handoff));
 assert.equal(q.ok,true,JSON.stringify(q));
 const r=createRoomRequest(takeQuestAction(takeQuestAction(q,"INSPECT"),"JOIN"));
 assert.equal(r.questPreviewReceipt.localActions.length,2);
 assert.equal(r.sourceProposal.compositionReceipt.id,id);
});
test("standalone browser module parses and contains quest→room export",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const match=html.match(/<script type="module">([\s\S]*?)<\/script>/);
 assert.ok(match,"Missing inline module");
 const check=spawnSync(process.execPath,["--input-type=module","--check"],{input:match[1],encoding:"utf8"});
 assert.equal(check.status,0,check.stderr);
 assert.match(match[1],/createRoomRequest\(q\)/);
});
