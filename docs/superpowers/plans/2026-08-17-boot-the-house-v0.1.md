# Boot the House v0.1 Implementation Plan

> **Status:** reconciled to live repository state after the first successful composed donor-owned heartbeat. This plan records what survived and the remaining landing / human-witness sequence. It does not grant merge authority.

**Goal:** Prove one inhabited federated heartbeat in which Full Measure composes TranchNode, Project0, and Corpus OS without absorbing their identity, authority, or execution semantics, then complete one human Garden witness.

**Architecture:** Full Measure is the playable shell and local projection owner. Each donor owns one bounded local process surface. Full Measure sends structured data only, requires explicit human crossing confirmation, and stores local residue plus foreign evidence references. Donor process transport is mechanism, not sovereignty.

## Governing invariants

- Crossing never transports sovereignty.
- Door visibility, nearby relevance, and gesture ranking are not permission.
- Human confirmation is separate from gesture decoding and destination authority.
- Project0 validation failure is pre-destination failure, not Corpus refusal.
- `admitted`, `refused`, `indeterminate`, and `failed` remain distinct.
- Unreachable doors cannot reach Project0 or Corpus.
- Full Measure never imports donor canonicalizers or accepts browser-selected authority / witness refs.
- Local donor stdin/stdout, time, and command identity are bounded.
- Fixture-backed nearby doors remain visibly fixture-backed.
- No central world daemon, master graph, network federation, or credential plane in v0.1.

---

## 1. TranchNode donor boundary

### Landed base

PR #50 landed the donor-owned one-shot `intent-stroke:stdio` boundary on TranchNode main.

Contract:

- request: `tranchnode/intent-stroke-stdio/v0.1`
- response: `tranchnode/intent-stroke-stdio-response/v0.1`
- canonical decoder remains TranchNode-owned
- result remains `authority: "none"`
- exact ambiguity / collision remains visible
- raw request bound: 1 MiB

### Remaining narrow repair

PR #52 — `fix: let Intent Stroke stdio bind raw strokes to its layout`

Exact review-ready head at reconciliation time:

`4566ec8960448e5dbca3f41058d9990f52e88052`

Why it exists: an independent process consumer cannot be required to precompute TranchNode's canonical layout hash. When `stroke.fieldLayoutRef` is omitted, TranchNode now binds the raw stroke to the canonical supplied layout itself. An explicitly supplied conflicting ref still fails with `LAYOUT_REF_MISMATCH`.

Evidence:

- RED: run `32006634138`, 91/92 pass; only raw-layout bootstrap failed.
- final exact-head GREEN: run `32006926263`, complete TranchNode check passed.
- Full Measure composed proof is GREEN against this exact head.

**Remaining:** separate exact-head landing approval for TranchNode #52.

Parallel TranchNode PR #42 was closed unmerged because it represented a competing process protocol.

---

## 2. Project0 donor boundary — complete on main

Project0 World Encounter Envelope v0.1 landed through PRs #40/#41.

PR #44 subsequently landed the canonical process surface on main:

`6341b0223f2b57148d617dcc98d1e0d0c68e14a5`

Contract:

- request: `project0/world-encounter-stdio/v0.1`
- response: `project0/world-encounter-stdio-response/v0.1`
- operations: `address | verify`
- record type: `exchange_envelope`
- Project0 remains sole owner of encounter addressing / verification
- structured nonzero validation errors remain pre-destination failures

Full Measure now consumes this landed contract directly.

Parallel Project0 PR #42 was closed unmerged because #44 had already established the donor-owned mainline surface.

**Remaining:** no Project0 donor landing required for Boot the House v0.1.

---

## 3. Corpus OS destination boundary — complete on main

Corpus PR #28 landed the destination-local World Encounter admission surface on main:

`63c0be4cd49c383ae167ded99103b79ba4626416`

Contract:

- request: `corpus-os/world-encounter-admission/v0.1`
- response wrapper: `corpus-os/world-encounter-stdio-response/v0.1`
- result: `corpus-os/world-encounter-result/v0.1`
- fixed v0.1 destination frame: `corpus-os:casework-v0.1`
- fixed v0.1 profile: `casework.synthetic-echo/v0.1`
- Full Measure uses code-owned destination subject `artifact:agreement-a`
- `callerAuthenticated: false`
- `authorityTransfer: "none"`
- `legalValidity: "unclaimed"`

Full Measure sends no actor authority, warrant, free-form command, or browser-selected capability. Its bounded operation input is derived from the addressed Project0 encounter ref.

Parallel Corpus PR #25 was closed unmerged because #28 had already established the stronger donor-owned mainline surface.

**Remaining:** no Corpus donor landing required for Boot the House v0.1.

---

## 4. Full Measure runtime core — implemented, owner-reviewed, composed GREEN

PR #3 — `Build Boot the House federated world runtime core`

Implemented application seams include:

- exactly three metadata-only door projections;
- fixture/live truth-state labeling;
- TranchNode gesture decoding;
- separate human confirmation;
- Project0 address + verify boundary;
- Corpus destination-local admission;
- local encounter residue and Garden reprojection;
- HTTP field/decode/cross/residue endpoints;
- Garden crossing UI and evidence surface;
- configured local donor process runner;
- composed GitHub Actions witness.

### Owner-review defects repaired test-first

1. **Unavailable runtime narrowing** — exact TypeScript discriminant fix.
2. **Unreachable door crossing leak** — an `unknown` door could previously reach the one Corpus adapter; now reachability is checked before Project0/Corpus.
3. **Unbounded donor stdin** — Full Measure now rejects oversized serialized input before `spawn()` as well as bounding output and timeout.
4. **HTTP semantic collapse** — unreachable door confirmation is now `409 crossing-unavailable`, not a `502 adapter-failed` lie.
5. **Parallel donor protocol drift** — Full Measure was rewritten to consume donor-owned Tranch / Project0 / Corpus mainline contracts instead of merging duplicate adapters.
6. **Tranch ambiguity response hardening** — only `none | collision` is accepted; unknown disposition vocabulary fails closed.
7. **Corpus wrapper hardening** — Full Measure verifies fixed frame/profile, `callerAuthenticated:false`, `authorityTransfer:"none"`, `legalValidity:"unclaimed"`, reason code, and string evidence/output refs.

### Current composed proof

Full Measure exact head at reconciliation time:

`a21944caa378d78e6701370f3f9e75762f9935ef`

Native repository gate:

- GitHub Actions `check` run `32007665042`: GREEN.

Real composed donor-owned witness:

- GitHub Actions `boot-house-integration` run `32007665048`: GREEN.
- TranchNode: `4566ec8960448e5dbca3f41058d9990f52e88052` (PR #52 review-ready).
- Project0: `6341b0223f2b57148d617dcc98d1e0d0c68e14a5` (landed mainline adapter).
- Corpus OS: `63c0be4cd49c383ae167ded99103b79ba4626416` (landed mainline destination).
- The witness completes an admitted Project0 -> Corpus crossing and writes a Full Measure residue / changed-field projection.

Known inherited repository condition: Full Measure `npm ci` currently reports one high-severity dependency vulnerability from the existing dependency tree. This slice did not modify package dependencies and does not claim a zero-vulnerability baseline.

### Remaining before Full Measure landing

1. Land TranchNode #52 under a fresh exact-head approval.
2. Replace Full Measure's temporary Tranch #52 PR-head pin with #52's landed main commit.
3. Re-run Full Measure native `check` and composed witness on the repinned exact head.
4. Update PR #3 evidence/body to that final head and mark ready for review.
5. Obtain separate exact-head landing approval for Full Measure #3.

---

## 5. Design PR landing

Full Measure PR #2 remains the design/ADR authority for Boot the House v0.1.

The implementation plan changed during reconciliation, but the approved design and transport ADR did not change semantically: Full Measure owns orchestration only; donors own law; local process transport remains the first mechanism.

Before #2 lands:

- verify the current design PR head;
- run its repository-required checks if any;
- require a fresh explicit exact-head landing confirmation because the plan reconciliation changed the PR head after the original design approval.

---

## 6. Human Garden witness — still required

Machine-green composition is necessary but does **not** satisfy the claim that the House is inhabitable.

After the landed runtime is available, one human witness must:

1. enter the Garden;
2. see exactly three bounded doors and their truth states;
3. gesture toward the Corpus door;
4. see the TranchNode decoding / ambiguity result;
5. explicitly confirm `Cross this door` separately;
6. receive one real Corpus destination-local disposition through Project0's envelope boundary;
7. return to a visibly changed Garden;
8. inspect the evidence chain explaining why it changed.

Record perceptual/usability observations as human witness, not constitutional fact.

---

## 7. GitBook reconciliation

GitBook CR #63 — `Boot the House — Federated World Encounter Loop v0.1` — remains draft until the project proof is landed and the human Garden witness exists.

After that witness:

- replace design-future language with exact landed repository refs;
- preserve the fact that nearby-door discovery is fixture-backed in v0.1;
- record the real admitted/refused/indeterminate/failure distinctions actually supported;
- do not graduate Multiverse NAV, Refusal Topology, or internet federation beyond their evidence;
- merge GitBook only after project evidence outranks narrative.

---

## Landing order

```text
Full Measure #2 design          -> fresh exact-head approval -> land
TranchNode #52 bootstrap       -> fresh exact-head approval -> land
Full Measure #3 repin/reverify -> fresh exact-head approval -> land
human Garden witness
GitBook #63 reconcile/publish
```

Project0 #44 and Corpus #28 are already on main and require no Boot the House landing action.

## Landing discipline

Every PR remains an independent authority boundary. Review-ready and GREEN do not imply permission to merge. Any push changes the authorized head and invalidates prior landing approval.
