# Full Measure — World Layer

Full Measure is the D&D-style life layer for real participation: a world people can inhabit, play through, and help shape without turning human worth into points.

The original Garden vertical still places evidence-derived participation over Jubilee Campfire's causal loop:

```text
Tension → Pledge → Accept → Report → Human Witness → Harvest → Capacity
```

The repository now also contains the first executable **Boot the House v0.1** world-encounter loop: a human gesture can be witnessed, decoded through TranchNode, wrapped as Project 0 encounter testimony, explicitly confirmed by a human, and offered to a destination-local Corpus OS admission boundary without collapsing the donor projects into one authority.

Only attributable events change the sheet. A model may propose a quest or narrate a chronicle, but it cannot award a Deed, establish truth, manufacture witness, or silently rewrite memory.

## Canonical identity

Use these names for this repository and project:

- **Full Measure**
- **Full Measure — World Layer**
- **Full Measure RPG**

An unqualified reference to **Full Measure** means this project.

This repository is **not** the song-to-video renderer. That tool is [The Haunted Toaster — Video Receipt Renderer](https://github.com/the-static-collective/the-haunted-toaster).

> Full Measure is the world you play inside. The Haunted Toaster is the machine that turns a song into a witnessed video.

## What works now

### Garden participation

The Garden answers three questions about the next living object:

1. How did this become what it is?
2. What remains unresolved?
3. Where can someone participate next?

The character sheet exposes six factual measures: Gifts, Quests, Deeds, Seeds, Witness, and Harvests. A self-report remains a proposal. A Deed grows only after a different authorized human confirms the returned report.

### Boot the House v0.1

The inhabited `WorldEncounterPanel` adds a bounded crossing instrument to the Garden/Campfire surface:

```text
raw human gesture
    ↓
TranchNode Intent Stroke v0.2
    ↓
candidate / ambiguity evidence
    ↓
explicit human “Cross this door”
    ↓
Project 0 World Encounter envelope
    ↓
Project 0 address / verify
    ↓
Corpus OS destination-local admission
    ↓
admitted / refused / indeterminate / failed
    ↓
local encounter residue + evidence / return refs
```

The important boundaries are executable:

- ambiguous or unknown traversal evidence does not auto-select a door;
- gesture recognition grants no crossing authority;
- a human must explicitly confirm the candidate crossing;
- Project 0 testimony carries zero source authority merely because it crossed a process boundary;
- only an admitted destination output may be projected as a constituted destination ref;
- donor failures and refusals remain distinct;
- fixture-only mode stays visibly fixture-only when local donor repositories are not configured;
- Full Measure stores local encounter residue; it does not rewrite donor history.

The server-side donor composition, inhabited Garden panel, and a composed proof receipt are landed on `main`.

Machine-readable snapshot: [`PROJECT_STATUS.json`](PROJECT_STATUS.json).

## Truth-state boundary

The participation slice still uses a local Express JSON event store and simulated profile switching, so the UI must not claim shared network authority merely because the experience is playable.

Boot the House is likewise a **local process federation**, not a universal bus. TranchNode, Project 0, and Corpus OS retain their own authority boundaries. Transport connects seams; it does not merge constitutions.

Production Shared mode belongs behind an authenticated authority plane. No browser or Android client may hold a service-role key, mutate canonical tables directly, or manufacture witness receipts. Models may propose; only people may harvest.

## Run it

```bash
npm install
npm run check
npm run dev
```

## Architecture notes

- [Project weave and authority boundaries](docs/PROJECT_WEAVE.md)
- [Inherent Dungeon Master contract](docs/DUNGEON_MASTER.md)

Full Measure integrates other systems by reference and adapter. It does not silently replace their distinct authority, meaning, privacy, or lineage contracts.
