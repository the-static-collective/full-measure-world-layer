# Boot the House v0.1 — Operator & Human Witness Guide

## Current claim

Boot the House v0.1 has a machine-composed proof that one bounded heartbeat can cross four real repository implementations:

```text
Full Measure field
  -> TranchNode Intent Stroke
  -> explicit confirmation
  -> Project0 World Encounter
  -> Corpus OS destination-local policy
  -> Full Measure residue / changed projection
```

That proof is necessary, but it is **not yet the human inhabitability witness**.

Nearby-door discovery is also still fixture-backed in v0.1. Founder Node / Pollen Scout is not represented as live unless a later repository-owned adapter actually supplies those doors.

## What the human witness must prove

A person must be able to:

1. open the Full Measure Garden;
2. see exactly three nearby doors and their evidence mode;
3. draw a gesture from the Garden toward a door;
4. see TranchNode's candidate traversal and any ambiguity;
5. separately press **Cross this door**;
6. receive a real destination-local result;
7. see the Garden projection change according to that result;
8. inspect the attributable evidence chain.

Gesture ranking, door relevance, Project0 envelope validity, Corpus policy, and Full Measure residue all remain non-authoritative with respect to one another. Crossing never carries sovereignty.

## Compatible donor revisions for the current composed proof

The repository CI witness pins these exact donor heads:

- TranchNode: `6cd2f28501b25ff7def1fac22a7184b4229e51dd`
- Project0: `0004017ab04df428ec7c20b43fd956299cdf1210`
- Corpus OS: `f7163e262200a4bcb5a3f1cdc273dc069d908d29`

Until those dependency PRs land, a local human witness should check out those exact revisions rather than pretending `main` already contains the donor process ports.

## Local workspace

A simple sibling layout is sufficient:

```text
workspace/
  full-measure-world-layer/
  tranchnode/
  project0/
  corpus-os/
```

Install each repository with its normal lockfile workflow.

From Full Measure, configure `.env`:

```dotenv
BOOT_HOUSE_TRANCH_DIR=../tranchnode
BOOT_HOUSE_PROJECT0_DIR=../project0
BOOT_HOUSE_CORPUS_DIR=../corpus-os
BOOT_HOUSE_SOURCE_VERSION_REF=github:the-static-collective/full-measure-world-layer@<EXACT_40_HEX_COMMIT>
```

`BOOT_HOUSE_SOURCE_VERSION_REF` must be an immutable Full Measure commit. `main`, a branch name, or an abbreviated SHA is refused. The configured public witness is that exact revision's `README.md`.

These settings are local paths and a public immutable source ref. They are not credentials.

## Start Full Measure

From the Full Measure checkout:

```bash
npm run dev
```

If donor paths or the pinned source ref are missing, Full Measure must continue to boot normally. The House card will show **THRESHOLD ONLY**, three fixture-backed doors, and an explicit reason that crossing is unavailable.

If the configuration is complete and compatible, the card shows **LIVE CROSSING**.

## Human witness sequence

1. Open the Campfire / Garden.
2. Find **The House · World Encounter v0.1**.
3. Verify the three doors are marked `FIXTURE`. This is truthful: door discovery is not live Founder Node yet.
4. Drag from **GARDEN** toward **Corpus OS**.
5. Inspect the TranchNode result. The gesture itself must not cross the boundary.
6. If a collision is shown, choose only among the tied leading doors.
7. Press **Cross this door**.
8. For the current verified-public-README specimen, expect Corpus OS to return `ADMITTED` when all pinned donor revisions are compatible.
9. Verify the visible world change is `illumination`.
10. Open **Inspect evidence chain**.
11. Verify the returned residue states `authority: none` and preserves the Tranch decoding, Full Measure confirmation, Project0 encounter, and Corpus policy evidence refs.

A different real destination disposition is not automatically a failed test. `REFUSED`, `INDETERMINATE`, and `FAILED` are legitimate distinct outcomes if the evidence explains why. The important invariant is that Full Measure does not coerce one class into another.

## Machine-composed witness

The repository workflow `.github/workflows/boot-house-integration.yml` checks out the exact donor revisions above, builds them, and runs:

```bash
node --import tsx scripts/boot-house-witness.ts
```

The witness emits a receipt under:

```text
artifacts/boot-house/
```

The receipt intentionally records:

- exact repository revisions;
- raw stroke ref;
- TranchNode decoding fingerprint;
- Project0 encounter ref;
- Corpus disposition and local policy evidence;
- Full Measure residue and before/after projection;
- `humanWitness: false`;
- fixture-backed door discovery;
- explicit non-claims.

## Non-claims

A successful v0.1 witness does **not** prove:

- a universal World object;
- a master multiverse graph;
- route search;
- autonomous traversal;
- transferable authority;
- live Founder Node / Pollen Scout door discovery;
- network federation;
- every Static Collective project already participating;
- that Full Measure's local `admittedDestinationRefs` are constitutional truth.

The v0.1 claim is narrower and stronger:

> One person can inhabit a Full Measure field, express a traversal intent, explicitly confirm one bounded crossing, receive a destination-local decision from another sovereign organ, and return to a visibly changed world while the evidence proves that no participating repository became the sovereign center.
