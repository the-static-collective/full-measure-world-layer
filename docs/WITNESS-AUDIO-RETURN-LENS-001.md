# WITNESS Community Audio Bible × THE PACT × Full Measure — Return Lens 001

Status: read-only draft. No production ingestion or changed authority.

## Correct source

WITNESS means the community Scripture-audio archive: https://github.com/the-static-collective/WITNESS
It is not the unrelated Human-Witness encounter project.
Current prototype is on branch genesis/community-audio-bible-001, using Matthew 5, WITNESS package v1 and optional separate room backend.
CANON-001 is binding: People choose what to read. WITNESS remembers. The listener composes. No verse quota, assignment, forced completion, or spiritual ranking.

## Six-part integration contract

1. Source: WITNESS package v1 recording metadata referenced by THE PACT v0.4 event bridge; source version and chosen text edition must be explicit.
2. Reads: only user-provided metadata candidate packet, declared recording ID/passsage/edition/audio SHA-256, PACT link/review/withdraw event history.
3. Proposes: REVIEW_CANDIDATE or HOLD with reasons; a possible participation Gift and playback/listening relationship for owner review, not constituted outcomes.
4. Authority: Full Measure project owner, existing Jubilee human-witness/pledge-receipt process, and any required Scripture/voice permissions; PACT, WITNESS and this adapter do not grant it.
5. Emits: inspectable read-only report with zero Deeds, zero Harvests, zero Capacity, source refs, missing evidence and non-claims.
6. Forbidden reads: WITNESS private audio stores, PACT room tokens, both projects' service-role keys, held/private material, all unrelated actor profiles.

## Boundaries

- SCRIPTURE TEXT is separate from edition, passage, human reading, reader, audio take and relation. Neither PACT nor Full Measure modifies the text.
- A WITNESS audio SHA-256 is a content checksum, not a proof of the reader's identity, speaker intent, consent or scripture accuracy.
- A PACT link means a player shared metadata, not necessarily recorded the audio.
- A PACT listening acknowledgment is a self-attested encounter, not independent verification of a recording's quality, truth or benefit.
- Repeated readings at the same passage address are valid abundance. No verse claiming, no rankings, no automatic winner or compulsory assignment.
- A Scripture recording cannot automatically produce a Deed, Harvest or Capacity, and worth or spiritual faithfulness is never measured by XP.
- A Full Measure Gift is a possible owner-reviewed participation description, not a consequence awarded by the bridge.
- A withdrawn PACT reference is not a deletion of the source WITNESS take. Preserve event lineage.
- Metadata-only packages are not a live WITNESS project database connection.

## Proof target

An internally consistent packet with a non-self peer listening report is REVIEW_CANDIDATE, not admitted. Missing audio, unverified permissions or identity remain as explicit requirements.
Self-review, digest mismatch in packet, duplicate review, misordered chain, missing edition, withdrawal or claimed nonzero Deeds become HOLD.
The lens must never fetch, write, upload, sign, infer new actor roles, update original WITNESS audio or constitute Full Measure state.

Implementation files: experiments/witness-audio-return-001.mjs and .test.mjs. Run node --test experiments/witness-audio-return-001.test.mjs.
Canonical PACT bridge: https://github.com/the-static-collective/planZ/blob/main/pact-cloud/WITNESS-AUDIO-BRIDGE-001.md