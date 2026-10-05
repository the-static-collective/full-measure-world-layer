# Tenet ARPG 002 — The Frontier

Tenet ARPG 001 proved that the existing Warm Thread machinery already behaves
like a playable ARPG when consequence and authority are projected honestly.

002 asks a larger question:

> Can consequential history itself become walkable terrain without turning
> every interesting artifact into a quest, recommendation, or command?

The first answer is executable.

## One overworld, mixed authority

The Frontier contains four terrain families:

~~~text
PLANZ RUINS
old plans sensed as unfinished historical terrain
INSPECT only

MINERAL QUARRY
verified GHoT/GrO artifacts
same object may expose different local affordances
INSPECT only here

RECOMBINANT Y
two preserved GrO branches
-> verified recombinant child
-> graph-frontier descendant
INSPECT only here

LIVING WARM THREAD
Full Measure / GHoT consequence region
ENTER
then local ACT / REFUSE rules from Tenet ARPG 001
~~~

The game does not normalize these into one universal interaction model.

That is the point.

## Frontier locomotion

The overworld itself is walkable.

Desktop:

~~~text
W A S D
or arrow keys
~~~

Phone:

~~~text
four movement buttons
~~~

A terrain node exposes commands only when the player is nearby.

~~~text
RUIN                 -> INSPECT
MINERAL              -> INSPECT
RECOMBINANT HISTORY  -> INSPECT
LIVING WARM THREAD   -> ENTER
~~~

Walking changes attention only.

## Ruins from PlanZ

PLANZ-002 produces deterministic SenseFrames and MutationCandidates while
preserving:

~~~text
authority = none
selection = NONE
~~~

The Frontier turns valid unary candidates into ruins.

A ruin may expose:

- the source plan;
- mutation chamber;
- bounded proposal;
- residual uncertainty.

It never becomes a quest merely because the player found it.

~~~text
SENSE != CHOICE
CANDIDATE != PLAN
RUIN != QUEST
~~~

## Mineral quarry

The GrO Mineral World-Seed witness proves:

- GHoT mined a real verified artifact;
- the same addressed seed entered two sovereign localities;
- Math Room and Terrain Room exposed different local affordances;
- a local player consequence emitted a non-executable Mineral WANT;
- GHoT mined and exactly verified the descendant;
- the descendant survived on a new road after ancestor roads died.

The Frontier therefore projects the verified object and its descendant as
Mineral terrain.

It does not import either locality's execution authority.

~~~text
MINERAL != CONSEQUENCE
SAME SEED != SAME LOCAL AFFORDANCE
VERIFICATION != ADMISSION
PLAYABLE THERE != EXECUTABLE HERE
~~~

## Recombinant Y

GrO TENET-012 produces a real multi-parent graph frontier:

~~~text
branch A ----\
              >---- recombinant W ---- descendant V
branch B ----/
~~~

The two parents remain independently real.

The recombinant witness must explicitly prove:

~~~text
inherited_authority = false
canonicalizes_parents = false
erases_parents = false
~~~

The graph-frontier checkpoint then carries bounded ancestry without carrying
the old full parent checkpoint bodies forever.

The Frontier renders this literally as Y-shaped terrain.

~~~text
FORK != CONFLICT
RECOMBINATION != CANON
PARENT SURVIVES CHILD
FRONTIER != HISTORY
GRAPH PRUNING != GRAPH ERASURE
~~~

## The important loop

The living Warm Thread remains the first region with actual bounded gameplay.

The player can:

~~~text
enter Warm Thread
-> inspect dormant TenetGram
-> Alice ACT
-> Bob ACT
-> Cara ACT or REFUSE
-> David ACT
~~~

Then return to the overworld.

If a consequence produced a future-door event, the overworld grows a new node:

~~~text
NEW FUTURE DOOR

source:
  Full Measure consequence

authority:
  projection-only

canonical TenetGram emission owner:
  GHoT
~~~

Thus the game now proves:

> consequence may change the playable frontier.

It does not prove:

> Full Measure may mint canonical TenetGrams.

## Live cross-repo terrain proof

The browser ships with a frozen specimen so it is immediately playable.

CI does not stop there.

It checks out and executes the current companion branches:

~~~text
planZ@feat/census-senses-mutation-002
GrO@mineral/world-seed-001
GHoT@gro-mineral-bridge-001
Dogram@impl/sparse-ice-probe-001
reLATTE@87006f3265103a8abe387d81597c58aeb39b0beb
~~~

Then CI generates:

1. a live PLANZ SENSE-001 run;
2. a live GrO TENET-012 graph-frontier witness;
3. a live GrO Mineral World-Seed witness backed by real GHoT mining and Dogram
   verification.

Those three outputs are passed through the exact same terrain validators used
by the Frontier module.

## Run locally

From the repository root:

~~~bash
python3 -m http.server 8000
~~~

Open:

~~~text
http://127.0.0.1:8000/experiments/tenet-arpg-frontier-002/
~~~

## Founding laws

~~~text
PLAYABLE TOPOLOGY != UNIVERSAL AUTHORITY

SENSE != CHOICE
RUIN != QUEST

VERIFIED MINERAL != LOCAL VALUE
PLAYABLE THERE != EXECUTABLE HERE

FORK != CONFLICT
RECOMBINATION != CANON
PARENT SURVIVES CHILD

CONSEQUENCE MAY CHANGE FRONTIER
GAME PROJECTION != CANONICAL TENETGRAM
FRONTIER CHANGE != XP
~~~

## Not yet

This slice does not yet make the whole Frontier universally executable.

Still separate:

- Telegram-authenticated sovereign player terminals;
- reLATTE-signed real-world ACT crossings;
- multiplayer simultaneous locality views;
- Lightwalker exact-region cooperative dungeon continuation;
- Toaster Listener perception terrain;
- PlanZ human selection/admission of a ruin mutation;
- canonical GHoT TenetGram emission from returned world consequence.

Those are next membranes, not missing claims.
