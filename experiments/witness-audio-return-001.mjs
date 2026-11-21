const ZERO = Object.freeze({Deeds:0,Harvests:0,Capacity:0});
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const SHA=/^[a-f0-9]{64}$/i;
const SEATS=new Set(['you','paula']);
function response(status,issues,subject=null){
 return {schema:'static-collective.full-measure.witness-audio-return-review.v1',
  status,issues,subject,awards:{...ZERO},admitted:false,authority:'NONE',
  missing:['Authenticated WITNESS source reference and permitted use','Source audio checksum independently checked at receiver',
  'Independent recipient / beneficiary report when real-world capacity is claimed',
  'Full Measure source-owner and Jubilee review for any constituted participation']};
}
/** Reviews a voluntary WITNESS audio reference from THE PACT, without writing world state. */
export function assessWitnessAudioReturn(input){
 const issues=[];
 if(!input||typeof input!=='object'||Array.isArray(input))return response('HOLD',['PACKET_ABSENT']);
 if(input.schema!=='static-collective.witness-pact-full-measure-candidate.v1')issues.push('WRONG_PACKET_VERSION');
 if(input.source?.project!=='WITNESS community audio Bible')issues.push('WRONG_SOURCE_PROJECT');
 const room=input.source?.room,rec=input.recording,bridge=input.bridge;
 if(typeof room!=='string'||!UUID.test(room))issues.push('INVALID_ROOM_REF');
 if(!rec||typeof rec.recordingId!=='string'||!rec.recordingId.trim()||rec.recordingId.length>200)issues.push('RECORDING_ID_ABSENT');
 if(!SHA.test(rec?.sha256||''))issues.push('INVALID_AUDIO_SHA');
 if(typeof rec?.passage!=='string'||!rec.passage.trim()||typeof rec?.edition!=='string'||!rec.edition.trim())issues.push('MISSING_PASSAGE_OR_EDITION');
 if(!input.awards||Object.keys(ZERO).some(k=>input.awards[k]!==0))issues.push('FOREIGN_AWARD_CLAIM');
 const events=input.events;
 if(!Array.isArray(events)||events.length<1||events.length>100)return response('HOLD',[...issues,'EVENTS_ABSENT_OR_OVERSIZED']);
 if(JSON.stringify(input).match(/"audio_base64"\s*:|"service_role"\s*:|"token"\s*:/i))issues.push('FORBIDDEN_PRIVATE_PAYLOAD');
 const ordered=[...events].sort((a,b)=>a.seq-b.seq);
 if(ordered.some((e,i)=>typeof e.seq!=='number'||(i>0&&ordered[i-1].seq>=e.seq)))issues.push('INVALID_EVENT_ORDER');
 let link=null,review=null,withdrawn=false;
 for(const e of ordered){
   if(!SEATS.has(e.actor)) {issues.push('UNKNOWN_SEAT');continue;}
   if(e.type==='witness.link'){
     if(link)issues.push('DUPLICATE_LINK');
     else link=e;
   }else if(e.type==='witness.review'){
     if(!link||withdrawn||review||e.actor===link.actor||!['heard','metadata'].includes(e.data?.mode))issues.push('INVALID_PEER_REVIEW');
     else review=e;
   }else if(e.type==='witness.withdraw'){
     if(!link||withdrawn||e.actor!==link.actor)issues.push('INVALID_WITHDRAWAL');
     else withdrawn=true;
   }else issues.push('UNSUPPORTED_EVENT');
 }
 if(!link)issues.push('LINK_EVENT_MISSING');
 else if(link.data?.recordingId!==rec?.recordingId||link.data?.hash!==rec?.sha256||link.data?.passage!==rec?.passage||link.data?.edition!==rec?.edition)issues.push('RECORDING_REF_CONFLICT');
 if(!link||bridge?.linkedBy!==link.actor)issues.push('LINKER_CONFLICT');
 if(!review||review.data?.mode!=='heard')issues.push('NO_INDEPENDENT_LISTENING_REPORT');
 if(JSON.stringify(bridge?.peerReports||[])!==JSON.stringify(review?[{actor:review.actor,mode:review.data.mode,note:review.data.note||'',at:review.at}]:[]))issues.push('PEER_REPORT_CONFLICT');
 if(withdrawn||bridge?.withdrawn===true)issues.push('WITHDRAWN_REFERENCE');
 const subject=rec?{recordingId:rec.recordingId,passage:rec.passage,edition:rec.edition,audioSha256:rec.sha256,
   claimedLinker:link?.actor||null,claimedListener:review?.actor||null,
   possibleMeasure:'owner-review-only Gift/participation candidate',sourceAuthority:'none'}:null;
 return response(issues.length?'HOLD':'REVIEW_CANDIDATE',issues,subject);
}
