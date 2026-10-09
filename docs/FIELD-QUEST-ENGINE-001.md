# FIELD QUEST ENGINE 001 — Physical Test Inbox × Full Measure × GrO

**State:** implemented proposal/encounter experiment. **Source physical proof:** absent. **Production intake:** not enabled.

## Why this is needed

An unfinished source-owned physical experiment can expose a *bounded opportunity* without becoming a completed Deed, a source technical verdict, or a public command. The inbox is a human-legible projection of **things still needing field evidence**.

```text
reLATTE SKYMIRROR-002 (source-owned FIELD_UNVERIFIED physical gate)
      -> static.field-test-entry/v0 (pinned source reference, candidate)
             |                                |
             +-> Full Measure PROPOSAL        +-> GrO held tenet seed
                   |                                      |
               opt-in selection                       actor leave-tenet
                   |                                      |
          Copy draft + open Garden               encounter/HOLD/ignore/act
                   |                                      |
             actual existing pledge               influence-only trace
                   |
               REPORT (self)
                   |
       independent authorized human witness
                   |
          source-owned technical verdict is STILL separate
```

## Landed executable work

- `src/lib/fieldQuestEngine.ts`: strict bounded `static.field-test-inbox/v0` / `static.field-test-entry/v0` decoder (unknown fields, duplicate source IDs, fraudulent physical-pass status and invalid revisions reject).
- `src/lib/fieldQuestInbox.ts`: **two explicitly source-pinned examples** from [reLATTE SKYMIRROR-002 draft PR #95](https://github.com/the-static-collective/reLATTE/pull/95) commit `540da48104a8a76a87f2acefd60df00ffa76237c`. The first field run is an open proposal. A replication requires a distinct prior human-reviewed field witness.
- `src/components/FieldQuestInboxPanel.tsx`: in-app cards with ACCEPT as local selection only, HOLD, REST, LEAVE OPEN. Copy Garden project draft and enter existing Projects flow. No silent creation or project/pledge API mutation; the operator still must explicitly establish actual project/pledge through existing workflow.
- `tests/field-quest-engine.test.ts`: positive and hostile boundaries.
- [GrO companion](https://github.com/the-static-collective/GrO/pull/22): `prepareQuestTenet` carries the same source entry into a content-addressed held tenet, with explicit native actor `leave-tenet` required to publish.

## Adding further physical test inbox entries

1. **Source owner** names a discrete, falsifiable field gate on a known commit, not a generic idea. Include what can be measured, equipment needs, safe procedure, required evidence and possible next experiment.
2. **Human review** admits the resulting exact-schema entry to the explicit `FIELD_TEST_INBOX.entries` candidate registry. The present system has **no auto-scraper or ingestion service**. Do not infer that every PR, issue, failed test or game suggestion should be made public automatically.
3. Source identity is an explicit pinned reference, not independently authenticated simply because it resembles a Git SHA. Never include secrets, identifiable participant images, location coordinates or raw private evidence in the public entries.
4. **Full Measure** presents source candidates but does not create Circle records until a human takes the ordinary Garden path. `ACCEPT` on these cards is local and ephemeral; `REST`, `HOLD` and `LEAVE_OPEN` are genuine no-penalty options.
5. **GrO** may prepare a held seed from the same source entry; it does not publish until a real actor explicitly exercises GrO's `leave-tenet` action under relevant local constraints. GrO's trace is evidence of the GrO act, *not* evidence the hardware test succeeded.
6. A **participant's returned field report** may say OBSERVED_PASS, OBSERVED_FAIL or INCONCLUSIVE, but all are `UNWITNESSED_SELF_REPORT` until reviewed. The source laboratory decides whether to update its own technical gate. Only the existing authorized human witness flow can produce a Full Measure confirmed Deed.
7. A fresh physical result may propose a new descendant quest; it must have its **own** versioned source and admission. No automatic reward, authority, legal permission or global XP follows.

## Execution

```bash
npm run check
# Vite + typecheck + full existing tests; includes tests/field-quest-engine.test.ts
npm run dev
# Full Measure tab → Physical Test Inbox → Select/Hold/Rest/Leave Open
```

No live camera link, printer job, satellite illumination, ham-radio permission, or physical device execution is claimed. The seed deliberately starts at SKYMIRROR because its proposed indoor mirror phone test already has published software artifacts and a visible unmet field evidence gate.

## Laws

```text
INBOX != LEDGER
PROPOSAL != PLEDGE
INSTRUMENT TEST != FIELD WITNESS
SELF REPORT != CONFIRMED DEED
HUMAN WITNESS != TECHNICAL VERDICT
SOURCE COMMIT != INDEPENDENT SOURCE PROOF
SOURCE TEST VERDICT != HUMAN WORTH
GAME AFFORDANCE != REQUIREMENT TO PARTICIPATE
REFLECTION != PERMISSION
```
