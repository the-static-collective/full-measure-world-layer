# Living Deck quest 001 — Full Measure experimental receiver

This **standalone local preview** consumes a real JSON proposal exported by [Static Field Living Deck PR #12](https://github.com/the-static-collective/static-field/pull/12). It implements INSPECT → JOIN → ATTEMPT → REPORT and HOLD → RETURN / REFUSE, with preserved local history and an optional ROroomOM room-request export.

This experiment does not write to Full Measure's real `projects`, `pledges`, `receipts`, or `domainEvents` data. A local join is not a real pledge; a self-report is not a confirmed deed. Incoming PostEmahh'n cards and stickers are fixtures grounded in a **design-only** Jubilee source, not issued cards.

## Play

Start the [Static Field Fellowship Table](https://github.com/the-static-collective/static-field/pull/12) locally from its `experiments/postemahhn-living-deck-001/` directory with `python3 -m http.server 8000 --bind 127.0.0.1`; compose Cicada → Radio + ECHO and export the Full Measure × ROroomOM proposal JSON.

From this directory:

```sh
python3 -m http.server 8002 --bind 127.0.0.1
```

Open http://127.0.0.1:8002, choose the exported proposal, inspect, join, attempt, report, and **Carry quest to ROroomOM**. The resulting `full-measure.living-deck-room-request` includes the original proposal and local unconfirmed quest receipt. A separate destination must independently validate the room request. No files are uploaded; downloads are explicit.

```sh
node --test tests/*.test.mjs
STATIC_FIELD_DECK_DIR=/path/to/static-field node --test tests/*.test.mjs
```

## Admission frontier

The independently issued source-card + source-sticker verification boundary, real human-account permissions, source-owned receipt validation, real Full Measure project creation, and ROroomOM authority to import or mutate its persistent world are **not** implemented. The guest room in ROroomOM PR #3 is a noncanonical local preview and must not treat a fabricated source-verified flag as proof.
