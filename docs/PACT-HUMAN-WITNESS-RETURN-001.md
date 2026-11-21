# PACT / Human-Witness crossing — read-only Full Measure lens 001

**Status:** Candidate integration, not a landed runtime route or admission authority. 2026-11-21.

## Why this crossing

THE PACT (`the-static-collective/planZ/pact-cloud`) is a live two-player cloud game with separate bearer-link seats, peer-confirmed XP, human encounter notes, explicit refusal, and a `static-collective.pact-world-review.v1` export. Full Measure must be able to read a candidate without converting gameplay scores into human worth, facts, Deeds, Harvests, or Capacity.

The source that most closely matches the encounter semantics is [Human-Witness](https://github.com/the-static-collective/Human-Witness), whose bounded evidence records distinguish presented subject, declared actor/capacity, human act/refusal, and external downstream admission. This is an adapter precedent; PACT does not claim to implement Human-Witness signing, legal assurance, authentic human identity, or a portable authority receipt.

The separately named [WITNESS](https://github.com/the-static-collective/WITNESS) repository is the community audio Bible and is not silently repurposed as a generic verification backend.

## Required six-part weave declaration

1. **Source and version:** `THE PACT cloud v0.3`, `static-collective.pact-world-review.v1`; source file `planZ/pact-cloud/edge.ts`. No source keys carried.
2. **Reads:** A manually supplied, bounded PACT review packet: quest definition, submission note and digest, distinct peer-confirmation basis or refusal, optional before/after claim, append-only event list.
3. **May propose:** A `REVIEW_CANDIDATE` with explicit missing evidence and source-local event refs, or `HOLD` with defects. Never creates a pledge, project, admission, or deed.
4. **Authority to accept:** Existing Full Measure project-owner and Jubilee authority human-witness process. Requires authenticated, independently confirmed recipient/beneficiary where relevant, project/pledge binding, measure-specific before/after evidence, review of contradictions, and local permission. Receiver may refuse at any time. No automatic local admission from PACT.
5. **Emits:** A read-only assessment `status`, `issues`, `provenance` and **0 Deeds / 0 Harvests / 0 Capacity**; no canonical Full Measure writes.
6. **Forbidden reads:** Never query PACT's private rooms, auth links, source API keys, other players' secret keys, unpublished/private projects, held material, or direct `public.pact_v1_*` tables. Receiver only inspects an explicitly exported packet.

## Truth boundaries

- `PACT XP != Full Measure Deed`
- `PEER_ACK != INDEPENDENT_BENEFICIARY_CONFIRMATION`
- `SUBJECT_HASH != AUTHENTICATED_PROVENANCE` (hash of editable JSON is reproducible by anyone)
- `WITNESS_MODE=TRUSTED != OBSERVED_COMPLETION`
- `OUTCOME_REPORT != VERIFIED_CAPACITY`
- `WITNESS_REFUSAL != FAILURE_TO_PLAY`
- `REVIEW_CANDIDATE != ADMIT`
- `ADMIT != CAPACITY`
- `FULL_MEASURE_AUTHORITY_STAYS_LOCAL`

Refusal, challenge, revision, and stale crossings must remain attributable. All source snapshots and digest references are presented as **claims until independently authenticated**. An incidentally matching title or copied packet proves no independent human acts.

## Proof target

Run the isolated review lens with fixture packets and require:

- well-shaped, internally consistent peer-confirmed packet → `REVIEW_CANDIDATE`, zero awarded quantities;
- self-confirmation, modified submission, invalid digest, contradictory event sequence, reopened/refused quest, or claimant-only impact review → `HOLD`;
- even a peer-reviewed impact still yields **zero Deeds, Harvests and Capacity**.

If this candidate lens passes review, it may later enter an explicit project-owned Full Measure receive/hold workflow. No phone/browser receives database administration permissions, and PACT never calls Full Measure's canonical writer.

## Implementation

An isolated lens and fixtures are in `experiments/pact-return-lens-001.mjs` and `.test.mjs` on this proposal branch. They are not linked into the running Express API and cannot award participation. Run with `node --test experiments/pact-return-lens-001.test.mjs`.
