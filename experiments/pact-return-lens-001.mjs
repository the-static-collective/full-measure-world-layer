import { createHash } from 'node:crypto';

const ZERO = Object.freeze({ Deeds: 0, Harvests: 0, Capacity: 0 });
const TYPES = new Set(['quest.create','quest.edit','quest.remove','quest.submit','quest.verify','quest.refuse','quest.reopen','impact.report','impact.review']);
const MODES = new Set(['observed','reviewed','trusted']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
const sha256 = value => createHash('sha256').update(value,'utf8').digest('hex');

function result(status, issues, provenance = null) {
  return {
    schema: 'static-collective.full-measure.pact-return-review.v1',
    status,
    issues,
    provenance,
    awards: { ...ZERO },
    authority: 'NONE',
    admitted: false,
    limitations: [
      'Untrusted JSON and a self-consistent SHA-256 digest do not authenticate the server or human identities.',
      'Peer review is not independent recipient confirmation or Full Measure/Jubilee admission.',
      'Only Full Measure local, explicitly authorized human-witness processes may award Deeds, Harvests or Capacity.'
    ]
  };
}

/** Read-only, non-authoritative assessment. Never writes a world state or awards a Deed. */
export function assessPactReturn(packet) {
  const issues = [];
  if (!packet || typeof packet !== 'object' || Array.isArray(packet))
    return result('HOLD',['MISSING_PACKET']);
  if (packet.schema !== 'static-collective.pact-world-review.v1') issues.push('WRONG_SCHEMA');
  const room = packet.source?.room;
  const questId = packet.subject?.questId;
  if (typeof room !== 'string' || !UUID.test(room) || typeof questId !== 'string' || !UUID.test(questId))
    issues.push('MISSING_SOURCE_IDS');
  const input = packet.events;
  if (!Array.isArray(input) || input.length === 0 || input.length > 150)
    return result('HOLD',[...issues,'EVENTS_MISSING_OR_OVERSIZED']);
  const events = input.filter(e=>e && e.data?.id===questId && TYPES.has(e.type));
  if (events.length !== input.length || events.some(e=>typeof e.seq !== 'number' && typeof e.sequence !== 'number'))
    issues.push('EVENT_GRAMMAR_OR_SEQUENCE');
  const seq = e => e.sequence ?? e.seq;
  const sorted = [...events].sort((a,b)=>seq(a)-seq(b));
  if (sorted.some((e,i)=>i>0 && seq(sorted[i-1])>=seq(e))) issues.push('DUPLICATE_EVENT_ORDER');
  let q=null, submission=null, confirmation=null, impact=null, impactReview=null, state='absent';
  for (const e of sorted) {
    const d=e.data||{},actor=e.actor;
    if (!['you','paula'].includes(actor)) { issues.push('UNKNOWN_SEAT');continue; }
    switch (e.type) {
      case 'quest.create':
        if (q || state!=='absent') {issues.push('DUPLICATE_QUEST');break;}
        if (typeof d.title!=='string' || !['you','paula','both'].includes(d.owner)) issues.push('INVALID_QUEST');
        q={id:d.id,title:d.title,owner:d.owner,notes:d.notes||'',due:d.due||'',creator:actor};
        state='open';break;
      case 'quest.edit':
        if (!q || !['open','needs_revision'].includes(state)) {issues.push('EDIT_NOT_OPEN');break;}
        if (d.changes?.title) q.title=d.changes.title;
        if (own(d.changes||{},'notes')) q.notes=d.changes.notes||'';
        break;
      case 'quest.remove':
        state='removed';break;
      case 'quest.submit':
        if (!q || !['open','needs_revision'].includes(state) || !(q.owner===actor || q.owner==='both')) {
          issues.push('INVALID_SUBMIT');break;
        }
        const sourceArray=['static-collective.pact.subject.v1',room,questId,q.title,q.owner,q.notes||'',q.due||'',q.creator,actor,d.proof||''];
        const expected=sha256(JSON.stringify(sourceArray));
        if (expected!==d.subjectDigest) issues.push('SUBJECT_DIGEST_MISMATCH');
        submission={...e,expected,digest:d.subjectDigest};confirmation=null;impact=null;impactReview=null;state='pending';break;
      case 'quest.verify':
        if (state!=='pending' || !submission || actor===submission.actor || !MODES.has(d.mode) || submission.digest!==d.subjectDigest)
          issues.push('INVALID_PEER_WITNESS');
        else {confirmation=e;state='done';}
        break;
      case 'quest.refuse':
        if (state!=='pending' || actor===submission?.actor || d.subjectDigest!==submission?.digest)
          issues.push('INVALID_REFUSAL');
        else state='needs_revision';
        break;
      case 'quest.reopen':
        state='open';submission=null;confirmation=null;impact=null;impactReview=null;break;
      case 'impact.report':
        if (state!=='done' || !submission || actor!==submission.actor || impact || typeof d.after!=='string' || !d.after.trim())
          issues.push('INVALID_IMPACT_REPORT');
        else impact=e;
        break;
      case 'impact.review':
        if (state!=='done' || !impact || actor===impact.actor || impactReview || !['reviewed','questioned'].includes(d.mode))
          issues.push('INVALID_IMPACT_PEER_REVIEW');
        else impactReview=e;
        break;
      default:issues.push('UNKNOWN_EVENT');
    }
  }
  if (state!=='done' || !confirmation) issues.push('QUEST_NOT_PEER_CONFIRMED');
  if (!impact) issues.push('NO_CONSEQUENCE_CLAIM');
  if (packet.subject?.sha256!==submission?.digest || packet.subject?.proof!==submission?.data?.proof)
    issues.push('EXPORT_SUBJECT_MISMATCH');
  if (packet.humanEncounter?.peer!==confirmation?.actor || packet.humanEncounter?.basis!==confirmation?.data?.mode)
    issues.push('EXPORT_WITNESS_MISMATCH');
  if (packet.candidateImpact?.after!==impact?.data?.after) issues.push('EXPORT_IMPACT_MISMATCH');
  if (JSON.stringify(packet.awards)!==JSON.stringify(ZERO)) issues.push('AWARD_CLAIM_NOT_ZERO');
  const provenance={room,questId,subjectDigest:submission?.digest||null,claimedReporter:submission?.actor||null,
    claimedReviewer:confirmation?.actor||null,witnessBasis:confirmation?.data?.mode||null,
    impactReviewBasis:impactReview?.data?.mode||null,subjectIntegrityOnly:issues.length===0};
  return result(issues.length?'HOLD':'REVIEW_CANDIDATE',issues,provenance);
}
