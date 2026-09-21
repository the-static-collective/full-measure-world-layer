# GRACE-ROOM-STAGE-004 — play the ordinary room

**Scope:** A browser-first spatial presentation of the existing independent Grace campaign. Layer 2 is a Grace-owned world, **not** an asserted Origin arrival. This patch does not alter `full-measure.grace-session.v1`, Tuesday/Wednesday replay, party rights, Grace's entry policy, or the Origin worldline.

The player sees a compact, pseudo-3D ordinary room with a window, table, screen door, and four interactable prop positions: telephone, grocery bag, quiet corner, and resting chair. Only existing `derivePlayActions(session)` entries become buttons. Clicking a prop **selects a known action**, making its existing cost and foreclosed options visible in the separate confirmation card. It never calls `commit`, introduces a free turn, creates a new event, or claims Grace allowed a visiting Origin party inside. Unavailable actions render as non-interactive silhouettes rather than fake possibilities. The normal card hand remains available as an accessible equivalent.

The sky, window and room color follow `deriveDayPhase` only; they do not advance time. The five existing stock totals remain visible where allowed. MADDcl0wn numeric-projection concealment remains intact. No model-derived interpretation or prayer outcome is presented as an external event.

**Visual identity:** earthy cottage / living-room diorama; warm ocher floor, sage and clay, Georgia scene heading, restrained tactile hotspots. One legible room hero (the occupied table), not a dense HUD or wall of pop-ups. On mobile the stage compresses; controls keep minimum 44px targets. All props are HTML buttons with action labels, keyboard focus and pressed selection. `prefers-reduced-motion` disables transitions.

## Plugin handoffs

Game Studio owns this immediately usable browser interaction and its React/DOM overlay. Build 3D Game Rooms can later turn the same room into a real authored shell, but this CSS illustration is **not** a Blender mesh or approved Function/Form/Runtime 3D deliverable. The eventual room needs its own layout, wall/opening schedule and approval; a screen-door graphic does not claim a traversable aperture. Game Development Studio's local `game-dev` CLI is unavailable here; no vendoring, GPU test, or paid model provider was run. Unity Essentials provides the later Unity-project onboarding/check workflow, not an installed Unity Editor connection. HyperFrames is optional for an earned scene transition or video interlude; no cinematic or sound file was added in this patch.

**Test boundary:** React SSR room and focused-surface checks, full Full Measure CI (`npm run check`) and an eventual human mobile/desktop visual playtest. No real 3D rendering or live Grace admission is claimed.
