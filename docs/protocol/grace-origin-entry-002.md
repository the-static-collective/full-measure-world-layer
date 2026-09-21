# GRACE-ORIGIN-ENTRY-002 — A door may be addressed without being open

Status: experimental, source-owned policy-only slice stacked on Full Measure GRACE-001 PR #33. This is neither an actual second Crossing nor evidence that the story's people or an external person have invited the party. The Origin First Crossing and Origin Table branches remain unmerged and unchanged.

## One world, one local authority

`specimens/grace-001/origin.world-manifest.v0.1.json` is Grace's machine-readable World Manifest, synchronized by test with `GRACE_ORIGIN_WORLD_MANIFEST` in `originEntry.ts`. The manifest declares the existing `full-measure.grace-session.v1` world, local ownership, time/continuation, explicit reference-only preview, and `liveAdapterEnabled: false`. Grace and Heaven remain independent campaign participants, not resources, destination NPCs created on entry, or avatars the traveling party can commandeer. Grace's existing session, Day Receipt, economy, resources, personal histories and local claims are not read or changed by this policy.

`inspectGraceCandidate` recognizes the strict reported-address shape from Origin Table PR #3. A reported address has `DETECTED`, `authorized: false`, and `admissionStatus: UNREQUESTED` and points to the pinned experimental Grace campaign source. Its source SHA is developer provenance, **not** a current-head freshness check, source-signature verification, invitation, or entry permission. Different worlds and fabricated admission claims fail closed. The result is `ADDRESS_RECOGNIZED_ONLY`, `admitted: false`.

`previewGraceTransfer` accepts an explicitly bounded proposed transfer manifest for inspection. Every item is classified without issuing a source departure, accepting a traveler, creating a local arrival, mutating a Grace session, or promoting source interpretation into destination fact. It returns `HOLD` and `admitted: false` unconditionally in this slice. Even reference-eligible items are **not admitted**. The caller cannot add source-offer or Grace-consent fields to claim successful authorization.

## Mixed preview, never automatic transfer

- A human participant reference is `HOLD_PERSON_CONSENT`. The resident campaign's characters are not automatically joined or placed under the arriving player's control.
- An anchored PostEmahh'n *reference* and unresolved Bell Thread are `REFERENCE_ELIGIBLE`, not a physical transfer, authoritative card import, solved Bell, or destination-local canon.
- STATIC FIELD local Charge is `REFUSE`. Its Resonance interpretation is `HOLD`.
- The Porch is `TRANSFORM_ON_ADMISSION`: a later **separate** Grace arrival must mint a new, source-linked local reported-origin occurrence; none is created in this preview.
- Private memory and source-local model grants are `WITHHOLD`. Unknown/undeclared items are `HOLD_UNDECLARED`.

## What is still required before a second Crossing

FOREIGN ROOM must publish its own actual exit offer and establish source receipt integrity. Grace must separately declare and record host consent, an eligible party human must confirm, and a Grace-owned arrival adapter must append an arrival occurrence against real local state. The existing Origin table candidate is not any of those things. A future integration must preserve local clocks, party/Anchor continuity and the exact first Crossing receipt, plus explicitly decide how a visitor enters a world whose ongoing Grace-001 storyline does not begin with that visitor.

Run `npm test` and `npm run check` in a checkout of the Full Measure branch. The focused suite is `tests/grace-origin-entry.test.ts`; its tests include manifest parity, forged/overclaimed Gate refusal, mixed transfer dispositions, unknown item/secret payload handling, source identity and determinism. No migrations, new dependencies, browser permissions or network endpoints are added.
