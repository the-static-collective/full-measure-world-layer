# GRACE-WALKABLE-ROOM-005 // a room you can move through

**Status:** optional procedural WebGL1 *prototype*, stacked on GRACE-ROOM-STAGE-004. It is a visual/spatial client for the existing Grace-001 Tuesday campaign, **not** a source of game truth, a production Blender room, or an Origin arrival.

## Spatial contract

The authored fixture is an 8 m × 8 m enclosed room with a sealed floor, ceiling and four walls. Initial eye position: (0, 1.58, 2.2) facing −Z. A table and half-finished meal occupy the interior. The telephone, grocery bag, resting chair and quiet corner have declared positions and short approach radii. A window is a sealed pane; the screen door is an opaque, closed leaf on the right wall. **It is not a playable passage or a Gate.** It does not grant or simulate a second Crossing.

Navigation uses discrete forward/back/strafe/turn inputs and a fixed player radius against bounds and the table. Keys work only when the playfield receives focus; mobile and keyboard users also have explicit DOM movement buttons. The normal illustrated-room toggle and the existing action hand remain available, including if WebGL cannot initialize.

## Authority and replay contract

The renderer receives only a camera pose and the recorded Tuesday phase. It cannot touch, read or mutate Grace's session, party, resources, receipts, source-offer envelope or Origin worldline. Nearby controls are an intersection of spatial reachability and `derivePlayActions(session)`. Selecting one merely chooses an existing action ID, showing the *existing* preview below the playfield. Only the already-implemented separate **Do it** action may commit game events through Grace's replay-checked campaign. Selecting a station neither spends a time block nor changes attendance.

The scene is an optional view within Tuesday's normal focus screen. Grace's callback, encounters, consequences, night attendance and Wednesday remain governed by their current priority rules and existing UI. The frame changes brightness using the current recorded phase; walking never advances the campaign clock. No personal data or production world arrival is imported.

## Asset and approval boundary

The current room is entirely local procedural geometry in WebGL1. It uses no Three.js download, external imagery, generated meshes, paid model provider, GPU compute API, Unity editor, or HyperFrames video. It is not the full Build 3D Game Rooms Function/Form/Runtime evidence package; final production geometry, architectural openings, textures, prop designs, budgets and human approvals remain separate. The closed screen-door leaf is intentionally not a decorative arch falsely implying a traversable opening.

Future room-production handoff: inspect the existing room and align a metrically consistent gameplay-room floor plan; declare collision/navigation and any *genuine* apertures before generating approved assets. Only after design and consent gates should a GLB/Unity client replace or complement this lightweight visual renderer. HyperFrames should produce an earned, skippable cinematic only after actual game-state transitions, never gameplay events.

## Checks

`npm run check` runs TypeScript, the repository's full test suite and production build. `tests/grace-walkable-room.test.ts` asserts geometry, navigation bounds and collision, nearby-action authority, inert closed door, SSR controls, and preservation of the original action hand. Browser/phone interaction, real GPU rendering and assistive-technology smoke tests should be independently verified before shipping beyond this prototype.
