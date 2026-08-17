# Boot the House v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` when independent repo slices can be delegated safely; otherwise use `superpowers:executing-plans` and execute this plan task-by-task. Every behavior change follows RED → observed failure → minimal GREEN → repository gate.

**Goal:** Prove one inhabited federated world heartbeat in which Full Measure composes real TranchNode, Project0, and Corpus OS boundaries without becoming their authority, then preserve the return evidence strongly enough for a human to inspect why the Garden changed.

**Architecture:** Full Measure remains the playable shell. Donor repositories expose repo-owned local process adapters with bounded, versioned JSON over stdin/stdout. The adapters wrap canonical donor logic rather than copying it. Full Measure invokes configured local commands, projects fixture-backed nearby doors until Founder Node is live, requires explicit human crossing confirmation, distinguishes pre-destination validation from destination disposition, and stores only local projection residue plus foreign evidence references.

**Tech Stack:** Node.js 22+, TypeScript, React 19, Vite, Express, Node child processes, GitHub Actions, repository-native test suites.

## Global invariants

- Crossing never transports sovereignty.
- Full Measure orchestration is projection, not constitutional authority.
- No cross-repo source imports or copied donor canonicalizers.
- No new world-runtime repository, daemon, network federation, or central credential plane.
- Nearby relevance and gesture ranking may affect visibility/candidates only.
- Human confirmation is separate from gesture decoding.
- `validation failure`, `admitted`, `refused`, `indeterminate`, and `failed` remain distinct.
- Refusal does not constitute the attempted destination state.
- Fixture-backed participation is visibly labeled as fixture/prototype evidence.
- Every adapter has a raw transport bound as well as donor semantic bounds.

---

## Task 1: TranchNode — expose Intent Stroke v0.1 through a bounded stdio adapter

**Issue:** `the-static-collective/tranchnode#43`  
**Branch:** `agent/intent-stroke-stdio`  
**PR:** `the-static-collective/tranchnode#50`

**Files:**
- Create: `scripts/intent-stroke-stdio.ts`
- Create: `test/intent-stroke-stdio.test.ts`
- Modify: `package.json`
- Reuse unchanged: `src/intent-stroke.ts`, `fixtures/intent-stroke-v0.1.json`

- [x] Add executable tests that spawn the missing adapter and prove canonical decoding, collision preservation, malformed JSON handling, unsupported wrapper schema, and inability to manufacture authority.
- [x] Observe GitHub Actions RED because the adapter does not exist.
- [x] Add only the minimal adapter that addresses input through existing helpers and calls `decodeIntentStroke`.
- [x] Add `npm run intent-stroke:stdio`.
- [x] Observe repository GREEN.
- [x] Add a second RED test proving oversized raw input must fail before unbounded retention.
- [ ] Add a 1 MiB transport limit while reading stdin and return `INPUT_TOO_LARGE`.
- [ ] Observe exact-head `npm run check` GREEN.
- [ ] Run owner/Riqor review; repair only concrete correctness/security/test gaps.
- [ ] Mark PR ready for review and stop at the landing gate until exact-head approval is given.

Acceptance: Full Measure can invoke TranchNode as an independent local process and receives the canonical decoding, including `authority: "none"`, fingerprint, candidates, and ambiguity, without TranchNode performing traversal.

---

## Task 2: Project0 — land World Encounter v0.1, then expose its canonical boundary through stdio

**Dependency:** Full Measure #8  
**Issue:** `the-static-collective/project0#43`

**Expected files after dependency landing:**
- Reuse: `src/world-encounter/index.ts`
- Reuse: `src/world-encounter/address.ts`
- Reuse: `src/world-encounter/validate.ts`
- Reuse: `src/world-encounter/evaluate.ts`
- Create: `scripts/world-encounter-stdio.ts`
- Create: `tests/world-encounter-stdio.test.ts`
- Modify: `package.json`

- [ ] Land the already-designed compatible World Encounter Envelope implementation on Project0 main before writing the adapter.
- [ ] Pin the exact landed Project0 commit in the adapter proof notes.
- [ ] Write RED stdio tests for valid construct/validate, malformed JSON, unsupported wrapper/profile, tampered address/body, disclosure rejection, and raw input bound.
- [ ] Observe the adapter tests fail for the missing process entrypoint.
- [ ] Implement a thin wrapper around the canonical World Encounter functions; do not reimplement canonicalization.
- [ ] Return pre-destination validation/compatibility failures as adapter results, never as destination refusals.
- [ ] Add `npm run world-encounter:stdio`.
- [ ] Run `npm run verify:all` and require GREEN.
- [ ] Owner/Riqor review for disclosure bypass, authority leakage, duplicate canonicalization, and missing adversarial tests.
- [ ] Open/ready PR and stop at its exact-head landing gate.

Acceptance: a valid bounded crossing object can be constructed/validated across a process boundary while Project0 remains the sole owner of its identity and encounter law.

---

## Task 3: Corpus OS — expose one bounded destination-local encounter admission profile

**Issue:** `the-static-collective/corpus-os#27`

**Files to inspect first:**
- `package.json`
- `scripts/corpus-session.*` or the source that builds `corpus:session`
- session/admission kernel files exercised by `tests/corpus-session.test.mjs`
- warrant/capability files exercised by `tests/mandatory-warrant-boundary.test.mjs` and `tests/capability-policy.test.mjs`

**Expected additions:**
- one kernel-owned stdio command source under the existing script convention
- one focused encounter-admission test file under `tests/`
- one package script, e.g. `world-encounter:stdio`

- [ ] Inspect the existing session command and select one already-declared bounded capability suitable for the specimen.
- [ ] Write RED tests for `admitted`, `refused`, `indeterminate`, host/runtime failure, malformed input, caller-minted authority, unsupported profile, and raw input bound.
- [ ] Observe failures before implementation.
- [ ] Implement the smallest adapter that maps the valid encounter testimony into existing Corpus-owned admission/session machinery.
- [ ] Never accept arbitrary shell text, arbitrary executable identifiers, or authority supplied by Full Measure.
- [ ] Preserve destination-owned receipt/evidence refs and destination frame identity.
- [ ] Run focused session tests, then `npm run check`.
- [ ] Owner/Riqor review for warrant bypass, replay, failure/refusal conflation, and authority forgery.
- [ ] Open/ready PR and stop at the exact-head landing gate.

Acceptance: Corpus OS independently decides what a valid crossing is allowed to become and returns one of the declared result classes under Corpus-owned authority.

---

## Task 4: Full Measure Phase A — process runner, donor clients, fixture doors, and residue kernel

**Issue:** `the-static-collective/full-measure-world-layer#5`

**Files:**
- Create: `src/lib/worldRuntime/types.ts`
- Create: `src/lib/worldRuntime/processAdapter.ts`
- Create: `src/lib/worldRuntime/tranchnodeAdapter.ts`
- Create: `src/lib/worldRuntime/project0Adapter.ts`
- Create: `src/lib/worldRuntime/corpusAdapter.ts`
- Create: `src/lib/worldRuntime/fixtureDoorSource.ts`
- Create: `src/lib/worldRuntime/residue.ts`
- Create: `tests/world-runtime-process.test.ts`
- Create: `tests/world-runtime-residue.test.ts`
- Modify: `server.ts`
- Modify: `.env.example`

- [ ] Write RED tests for command allowlisting/configuration, stdin/stdout JSON framing, timeout, nonzero exit, malformed donor output, output-size bound, unavailable command, and no shell interpolation.
- [ ] Implement the process runner with executable + argv arrays, bounded stdin/stdout, timeout, and no `shell: true`.
- [ ] Add donor-specific clients that validate only Full Measure-local adapter envelopes; donor semantic validation stays donor-owned.
- [ ] Add a pinned exactly-three-door fixture with `sourceMode: "fixture"` and provenance refs.
- [ ] Write RED residue tests proving all five outcome classes remain distinct and refusal cannot create admitted-world consequences.
- [ ] Implement Full Measure-local `WorldEncounterResidue` projection store using foreign refs, not copied donor bodies as new authority.
- [ ] Add server endpoints for field projection, door scan, stroke decode, confirmed encounter, and evidence inspection.
- [ ] Run `npm run check`.

Acceptance: server-side Full Measure can compose configured local donor processes safely before any Garden crossing UI exists.

---

## Task 5: Full Measure Phase B — inhabited Garden crossing UX

**Issue:** `the-static-collective/full-measure-world-layer#6`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/types.ts`
- Modify: `src/lib/api.ts`
- Create: `src/components/WorldDoors.tsx`
- Create: `src/components/TraversalField.tsx`
- Create: `src/components/EncounterEvidence.tsx`
- Create: `tests/world-runtime-api.test.ts`
- Add focused UI/state tests following the repository's available test pattern

- [ ] Render exactly three door projections and visibly distinguish fixture/live source mode.
- [ ] Capture bounded pointer stroke points in a declared local layout.
- [ ] Submit stroke for TranchNode decoding and render best candidate plus collision/ambiguity.
- [ ] Require a separate `Cross this door` action; never cross on pointer-up or decoder rank alone.
- [ ] Show Project0 validation failure before any destination result UI.
- [ ] Render destination `admitted`, `refused`, `indeterminate`, and `failed` distinctly.
- [ ] Reproject the Garden from recorded history: admission may illuminate; refusal may leave a scar; indeterminate stays fogged/contested; failure stays operational.
- [ ] Add evidence inspector showing source refs, stroke/decoding ref, confirmation ref, envelope ref, destination refs, unresolved refs, and return refs.
- [ ] Run `npm run check`.

Acceptance: a human can complete the first full interaction without the UI implying permission that the donor systems did not grant.

---

## Task 6: Founder Node follow-on — replace fixture door discovery with live Pollen Scout

**Issues:** `the-static-collective/founder-node#3`, Full Measure #11  
**Dependency:** land the compatible Pollen Scout implementation first.

- [ ] RED tests: deterministic ≤3 doors, provenance/relevance reasons, unknown relation fail-closed, `authority: "none"`, raw input bound.
- [ ] Implement Founder Node-owned stdio adapter around landed Pollen Scout logic.
- [ ] Run Founder Node repository gate.
- [ ] In Full Measure, add `NearbyDoorSource` live adapter behind the same application seam used by the fixture.
- [ ] Prove switching source modes does not change Full Measure constitutional semantics.
- [ ] Keep fixture mode available for deterministic development/tests and label it honestly.

Acceptance: live nearby-door discovery improves perception without becoming permission or a master graph.

---

## Task 7: Phase C — composed proof, reconstruction, human witness, and downstream documentation

**Issue:** `the-static-collective/full-measure-world-layer#7`

**Files:**
- Create: `fixtures/boot-the-house-v0.1/manifest.json`
- Create: `scripts/verify-boot-the-house.mjs`
- Create: `tests/boot-the-house-integration.test.ts`
- Modify: `README.md` only after proof is real
- GitBook CR #63: update only after repository evidence exists

- [ ] Pin exact repository, adapter profile, and commit for Full Measure, TranchNode, Project0, and Corpus OS.
- [ ] Compose the real local commands; mocks alone do not satisfy this task.
- [ ] Prove one admitted route end-to-end.
- [ ] Prove refusal leaves constituted source state unchanged while preserving attributable residue.
- [ ] Prove indeterminate and operational failure remain separately reconstructable.
- [ ] Prove a pre-destination Project0 validation failure never invokes Corpus OS.
- [ ] Prove exact replay reproduces the same addressed donor evidence for the pinned specimen.
- [ ] Prove missing return evidence yields an explicitly partial reconstruction rather than invented continuity.
- [ ] Run all participating repository gates on their pinned heads.
- [ ] Conduct one human Garden session: three doors → gesture → candidate/ambiguity → explicit confirmation → real destination disposition → changed Garden → evidence inspection.
- [ ] Record the human witness without upgrading subjective usability observations into constitutional facts.
- [ ] Update GitBook CR #63 with project-backed evidence and exact refs, then merge GitBook only after the project proof is landed.

Acceptance: the Collective has one evidenced inhabited heartbeat across sovereign repositories. This proves a federated runtime specimen; it does **not** prove universal Multiverse NAV, autonomous routing, or a master world graph.

## Landing discipline

Every repository PR is independent. A green or review-ready PR is **not** authorization to merge. Before landing each PR, bind confirmation to that PR's current exact head SHA and use the repository's normal protected merge path. Any push invalidates earlier landing approval.
