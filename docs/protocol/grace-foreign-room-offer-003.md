# GRACE-FOREIGN-ROOM-OFFER-003 — the source offer can be recognized, not obeyed

This policy slice is stacked on the draft GRACE-ORIGIN-ENTRY-002 branch. It uses the **exact portable source-offer fixture emitted by WORLDSEED's ORIGIN-FOREIGN-ROOM-EXIT-003**, not an independently invented invitation. The fixture is copied to `specimens/grace-001/fixtures/origin-foreign-room-exit-003.json` and pinned by its Git blob identity. The in-fiction FOREIGN ROOM and its visitors are still synthetic; the source envelope does not establish a real person's consent or a production live bridge.

`inspectGraceSourceExitOffer(candidate, offer)` insists on the source-shaped `origin.foreign-room-exit-offer.v0.1` envelope, its exact Gate, prior Crossing, party, Anchor, source-local event/receipt references and narrow four-item reference-only bundle. It rejects claimed admission, mismatched IDs, synthetic input pretending to be live-verified, extra authorization fields, private payloads, invalid item sets and non-hash references. A correctly shaped receipt hash remains **unverified by Grace**: source provenance and receipt authenticity require a separately authorized live adapter, not the mere presence of a digest.

`previewGraceSourceExitOffer(candidate, offer)` invokes the existing Grace-local item classifier. It returns `HOLD` and `admitted: false`, with human participation waiting on consent, card/Thread references eligible for later review, and the reported-origin ref undeclared. It does not mutate the Grace campaign, decide the host's position, create a visitor, grant access or perform a second Crossing.

Before any actual arrival, Grace must record its own host consent under a declared policy, receive an eligible traveler confirmation, validate a real source-owned departure receipt and mint a local arrival occurrence. Until then, this is contract interoperability with explicit remaining authority gaps—not teleportation.

Focused test: `node --experimental-strip-types --test tests/grace-origin-entry.test.ts tests/grace-origin-foreign-room-offer.test.ts`. Full repository check: `npm run check` in the Full Measure branch checkout.
