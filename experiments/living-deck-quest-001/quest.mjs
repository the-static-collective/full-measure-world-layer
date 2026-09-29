// Full Measure local QUEST proposal receiver for Static Field Living Deck.
// This is an experimental preview reducer, NOT the production Project/pledge store.

const plain=x=>x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const fail=(code,description)=>({ok:false,code,description});
const cards=["cicada","cup","radio","door"], stickers=["echo","pour","open","grow","call","wait"];
function validRelation(s){
 if(!plain(s)||!cards.includes(s.firstId)||!cards.includes(s.secondId)||!stickers.includes(s.stickerId)||s.firstId===s.secondId)return false;
 if(s.stickerId==="echo"&&!(s.firstId==="cicada"&&s.secondId==="radio"))return false;
 if(s.stickerId==="pour"&&s.firstId!=="cup")return false;
 if(s.stickerId==="open"&&s.secondId!=="door")return false;
 if(s.stickerId==="call"&&!["cicada","radio"].includes(s.firstId))return false;
 return true;
}
const text=(v,max)=>typeof v==="string"&&v.length>0&&v.length<=max;
export function openQuestHandoff(source){
 if(typeof source==="string"){
  if(source.length>65536)return fail("too-large","Local handoff exceeds 64 KiB.");
  try{source=JSON.parse(source)}catch{return fail("invalid-json","Invalid handoff JSON.");}
 }
 if(!plain(source)||source.format!=="static-field.living-deck-portable-proposal"||source.version!==1)
  return fail("invalid-format","Expected Static Field Living Deck portable proposal v1.");
 if(source.status!=="unverified-proposal"||source.sourceVerification!=="unavailable"||
  source.sourceCardReceipts!==null||source.sourceStickerReceipt!==null||source.externalAuthority!=="none")
  return fail("source-overclaim","An unverified creative proposal cannot declare issued-card authority.");
 const design=source.sourceDesign;
 if(!plain(design)||design.repository!=="the-static-collective/Jubilee-Engine-VM"||
 design.commit!=="20b529038be86cb88e2fd386536493cd694fd719"||
 design.sourceCardStatus!=="specified-not-issued"||design.proofOfPhysicalCard!==false||
 design.proofOfStickerIssuance!==false)
  return fail("design-mismatch","Unknown or inflated design origin.");
 if(!validRelation(source.selection))return fail("unsupported-relation","No local relation adapter is defined.");
 const s=source.selection,c=source.compositionReceipt;
 const id=`pc001:${s.firstId}:${s.stickerId}:${s.secondId}`;
 if(!plain(c)||c.id!==id||c.schema!=="static-field.postemahhn-composition-preview.v0"||
 !Array.isArray(c.orderedCardRefs)||c.orderedCardRefs.length!==2||
 c.orderedCardRefs[0]!==`fixture:${s.firstId}`||c.orderedCardRefs[1]!==`fixture:${s.secondId}`||
 c.stickerRef!==`fixture:${s.stickerId}`||c.authority!=="none"||c.status!=="proposed"||
 c.acceptedIntoSharedWorld!==false||!plain(c.provenance)||
 c.provenance.origin!=="local-demo-fixture"||c.provenance.verifiedExternalCardIdentity!==false||
 c.provenance.importedPostEmahhnReceipt!==null)
  return fail("composition-tampered","Composition and declared source cards disagree.");
 const draft=source.fullMeasure;
 if(!plain(draft)||draft.format!=="full-measure.project-draft-proposal/0.1"||
 draft.status!=="proposal"||draft.notAProjectRecord!==true||draft.sourceCardProof!==null||
 !text(draft.title,200)||!text(draft.story,4000)||!Array.isArray(draft.needs)||
 draft.needs.length!==1||!plain(draft.needs[0])||!text(draft.needs[0].title,500)||
 draft.needs[0].status!=="open")
  return fail("project-overclaim","Incoming payload is not a bounded Full Measure project draft.");
 if(!plain(source.roroomom)||source.roroomom.format!=="static-room-source-handoff"||
 source.roroomom.object?.id!==id||source.roroomom.sourceEvidence?.issuedCardProof!==null)
  return fail("room-overclaim","A compatible local room must remain a proposal.");
 return {
  ok:true,format:"full-measure.living-deck-quest-preview",version:1,
  sourceProposal:source,compositionId:id,title:draft.title,story:draft.story,
  need:draft.needs[0].title,phase:"offered",localTrace:[],
  sourceVerification:"unverified",externalAuthority:"none",
  projectCreated:false,pledgeConfirmed:false,localDisposition:"held",sharedWorldChanged:false
 };
}
export function takeQuestAction(q,action){
 if(!q?.ok||q.format!=="full-measure.living-deck-quest-preview"||!Array.isArray(q.localTrace))
  return fail("not-open","Open a Living Deck quest proposal first.");
 if(!["INSPECT","JOIN","ATTEMPT","REPORT","HOLD","RETURN","REFUSE"].includes(action))
  return fail("unknown-action","The local quest action is unsupported.");
 if(q.localTrace.length>=60)return fail("trace-full","Local event budget exhausted; export first.");
 const phase=q.phase;
 if(phase==="refused")return fail("refused","A refused proposal cannot resume without a new encounter.");
 if(phase==="held"&&action!=="RETURN"&&action!=="REFUSE")return fail("held","A held quest requires explicit return.");
 if(action==="INSPECT"&&phase!=="offered")return fail("inspect-not-available","Inspection is available at the offered phase.");
 if(action==="JOIN"&&phase!=="inspected")return fail("inspect-first","Inspect before joining the proposed quest.");
 if(action==="ATTEMPT"&&phase!=="joined")return fail("join-first","Join before attempting the quest.");
 if(action==="REPORT"&&phase!=="attempted")return fail("attempt-first","Attempt before reporting what happened.");
 if(action==="RETURN"&&phase!=="held")return fail("not-held","Return applies only to a held quest.");
 if(action==="HOLD"&&phase==="held")return fail("already-held","Already held.");
 const newPhase={INSPECT:"inspected",JOIN:"joined",ATTEMPT:"attempted",REPORT:"reported-unconfirmed",HOLD:"held",RETURN:"offered",REFUSE:"refused"}[action];
 return {...q,phase:newPhase,localTrace:[...q.localTrace,action],
   // Local play cannot mint a Project, a confirmed deed, or destination authority.
   projectCreated:false,pledgeConfirmed:false,localDisposition:"held",sharedWorldChanged:false};
}
export function exportQuestPreview(q){
 if(!q?.ok||q.format!=="full-measure.living-deck-quest-preview")return fail("not-open","No quest to export.");
 return {
  format:"full-measure.living-deck-local-quest-receipt",version:1,
  receiptRef:`fm-local-preview:${q.compositionId}:${q.localTrace.length}`,
  sourceCompositionId:q.compositionId,sourceDesignCommit:q.sourceProposal.sourceDesign.commit,
  phase:q.phase,localActions:[...q.localTrace],sourceVerification:"unverified",
  projectId:null,pledgeConfirmationRef:null,authority:"none",
  localDisposition:"held",sharedWorldChanged:false,externalPublication:false
 };
}
export function createRoomRequest(q){
 const receipt=exportQuestPreview(q);
 if(receipt.ok===false)return receipt;
 return {
  format:"full-measure.living-deck-room-request",version:1,
  sourceProposal:q.sourceProposal,
  questPreviewReceipt:receipt,
  grant:"preview-only",requiresRoomIndependentValidation:true,
 };
}
