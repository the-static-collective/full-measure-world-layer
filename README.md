# Full Measure — World Layer

Full Measure is the D&D-style life layer for real participation: a world people can
inhabit, play through, and help shape without turning human worth into points.

The current vertical slice places a Garden and evidence-derived character sheet over
Jubilee Campfire's causal loop:

```text
Tension → Pledge → Accept → Report → Human Witness → Harvest → Capacity
```

Only attributable events change the sheet. A model may propose a quest or narrate a
chronicle, but it cannot award a Deed, establish truth, manufacture witness, or silently
rewrite memory.

## Canonical identity

Use these names for this repository and project:

- **Full Measure**
- **Full Measure — World Layer**
- **Full Measure RPG**

An unqualified reference to **Full Measure** means this project.

This repository is **not** the song-to-video renderer. That tool is
[The Haunted Toaster — Video Receipt Renderer](https://github.com/the-static-collective/the-haunted-toaster).
Legacy names such as `Full Measure Video Receipt` and `START_FULL_MEASURE.bat` belong
only to that renderer's history and must not become this project's identity.

> Full Measure is the world you play inside. The Haunted Toaster is the machine that
> turns a song into a witnessed video.

## The playable slice

The Garden is the first screen. It answers three questions about the next living
object:

1. How did this become what it is?
2. What remains unresolved?
3. Where can someone participate next?

The character sheet exposes six factual measures: Gifts, Quests, Deeds, Seeds,
Witness, and Harvests. A self-report remains a proposal. A Deed grows only after a
different authorized human confirms the returned report.

Use **Pass the fire** to exercise the multi-human boundary in prototype mode:

1. A contributor pledges to a quest.
2. The project opener accepts it.
3. The contributor reports what happened.
4. A different authorized human confirms it.
5. The contributor's Deed measure grows and the project can be harvested.

## Truth-state boundary

This slice runs against a local Express JSON event store and simulated profile
switching. The UI therefore says `Prototype · This device`. It must not claim `Shared`,
`Chain verified`, or canonical Jubilee authority.

Production Shared mode belongs behind an authenticated authority plane. No browser or
Android client may hold a service-role key, mutate canonical tables directly, or
manufacture witness receipts. Models may propose; only people may harvest.

## Run it

```bash
npm install
npm run check
npm run dev
```

## Architecture notes

- [Project weave and authority boundaries](docs/PROJECT_WEAVE.md)
- [Inherent Dungeon Master contract](docs/DUNGEON_MASTER.md)

Full Measure integrates other systems by reference and adapter. It does not silently
replace their distinct authority, meaning, privacy, or lineage contracts.
