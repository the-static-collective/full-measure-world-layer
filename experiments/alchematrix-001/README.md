# ALCHEMATRIX-001 — The Haunted Telescope

**Status:** isolated playable experiment; not Full Measure canon and not an implementation of the full Alchematrix design.

## What this proves

A player gathers fictional materials, crafts a basic telescope, adds a separating probe and memory vessel, observes two visually identical fictional prisms, and sockets the telescope into a previously incapable workbench. The workbench derives its new capabilities from its installed instrument and can then produce a Question Key requiring two distinct retained observations. The key opens a new door and question. The world source is immutable and each accepted action gets an independent local receipt. Invalid actions cannot mutate the original state.

This is actual *composer composition*: the bench does not receive an arbitrary `unlocked=true`; it derives a typed capability list from the installed instrument, and the new artifact needs the instrument *and* independent observations. It is still a tightly bounded synthetic proof, not a general composition framework or an integration with Dogram/MEMENTO/Blender/Toaster.

## Play

Open **`play.html`** directly in a modern browser (including a mobile browser); it has no dependencies, account, server, or network calls. Alternatively, from this directory run `python3 -m http.server 8000` and visit `http://localhost:8000/` for the modular source version. Work through the in-game steps and optionally export the local JSON receipt.

## Test

Run `node --test core.test.mjs` with modern Node.js (Node 18+ recommended). `core.mjs` is the authoritative pure game-state engine; `index.html` + `app.mjs` are the modular interface. `play.html` is a generated single-file bundle of that interface and engine for easy opening on a phone. Running this test is not a test of native mobile browser behavior.

## Alchematrix design slice — the larger world

The originating idea: `Auto Disco -> executable` can be made spatial and playable. Minecraft supplies mining, blocks, and an explorable world; alchemy supplies recipes and transformations; code supplies executable operations; narrative structures inspired by LOST supply mysteries, observer-relative encounters, unresolved histories, and instruments such as a lighthouse. The composer itself is an ingredient that may be crafted and installed into other composers.

**Ingredient families:** materials; distinguishable signals; observer-local memories; witnessed relationships; executable constructors; authored questions; world recipes. These types are not interchangeable. An artifact, a composer, a recipe, an occurrence, and a world instance have distinct identities.

**Composer families:** material foundry, distinction forge (Dogram), memory loom (MEMENTO), cinematic crucible (Haunted Blender), resonance kitchen (Haunted Toaster / Static Live / Auto Disco), story engine (National Treasure / Full Measure). Every source remains independently owned; names denote possible adapters, not claims that they are wired into this experiment.

**Fruits for further experiments:** House That Takes Attendance (memory + architecture); Song That Becomes a Road (music + geography); Camera That Makes Puzzles (cinema + probes); Haunted Hammer (tool history + crafting); Band That Learns Its Songs (music + witnessed tradition); Landscape That Remembers a Camera (film + history); Library of Unfinished Stories (question engine + world); Workshop Inside the Workshop (nested composers); Scene That Becomes an Instrument (film + performance); Quest That Builds Its Dungeon (narrative + world construction); Dreaming Garden (memory + authored imagery); Composer Breeding Ground (higher-order composition); Naming Forge; Recipe Ecosystem; Performable Atlas; Fossil Record; World Orchard; Portable Room; World Graft.

**First next crossing:** Replace the local synthetic `frequency-probe` and `memory-receipt` with separately pinned adapter calls in an ORCHARD-like dry-run. Add two observer-local inhabitants and an explicit exposure / uptake test before making any claim about shared learning. Do not auto-merge source branches, infer authority from source material, or claim a simulation is real-world evidence.

**Core seal:** MINE -> DISTINGUISH -> CRAFT -> COMPOSE -> INHABIT -> WITNESS -> REMEMBER -> RECOMPOSE. Everything may become an ingredient, but nothing becomes interchangeable merely by sharing a recipe.