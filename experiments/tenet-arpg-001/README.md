# Tenet ARPG 001 — The Warm Thread

This is the first playable ARPG projection over the real Warm Thread / TenetGram
architecture.

It is not a gamified score layer.

It is a rehearsal world where the player navigates the same bounded state that
Full Measure and GHoT already prove.

## Play loop

~~~text
ORIENT
  |
  v
walk to dormant TenetGram
  |
  v
INSPECT
  |
  v
Warm Thread becomes visible
  |
  +--> Alice / fallen tree
  |       ACT one release attempt
  |
  +--> Bob / cutter
  |       ACT one cutting attempt
  |
  +--> Cara / pickup
  |       ACT one haul
  |       OR REFUSE
  |
  +--> David / house
          ACT one acceptance
~~~

Every ACT belongs only to its named local actor.

The player is traversing a deterministic specimen of those terminals. This is
not a production identity or permission system.

## Success path

A complete run produces:

~~~text
tree released
-> wood cut
-> one load hauled
-> one load accepted for home heat
-> one house warm
~~~

Finite state changes:

~~~text
Bob: 45 minutes -> 0
Cara: one truck load -> 0
firewood: not-yet-produced -> accepted-for-home-heat
heat need: open -> met-for-this-load
~~~

And:

~~~text
XP = null
level = null
human worth = null
~~~

The world changed. No score was minted.

## Refusal path

At Cara's truck the player may choose REFUSE.

The world does not reset.

~~~text
tree release     DONE
wood cutting     DONE
haul             REFUSED
heat need        OPEN
firewood         CUT AT SOURCE
~~~

The game exports honest Full Measure residue and places a **dormant future
door** elsewhere on the map.

That local door says:

> What becomes possible next from this consequence?

It is deliberately marked as a game projection.

GHoT remains the owner of canonical TenetGram emission.

~~~text
REFUSAL != DEFECT
RESIDUE != SCORE
FAILURE/REFUSAL != HISTORY ERASURE
~~~

## World objects

The first map contains:

- the Porch — one dormant TenetGram;
- Alice's fallen ash;
- Bob's cutting capacity;
- Cara's pickup capacity;
- David's household heat need;
- a dormant future-door location that appears after consequence.

The map is not a public vulnerable-household map.

The household's exact address remains withheld by the underlying Warm Thread
world contract.

## Controls

Desktop:

~~~text
W A S D
or arrow keys
~~~

Phone:

~~~text
four movement buttons
~~~

Move near a node to expose its lawful local commands.

Clicking a map node nudges the player toward it; it does not teleport or execute
the node.

## Run locally

From the repository root:

~~~bash
python3 -m http.server 8000
~~~

Then open:

~~~text
http://127.0.0.1:8000/experiments/tenet-arpg-001/
~~~

## Architecture

~~~text
GHoT TenetGram
portable dormant possibility
       |
       v
FULL MEASURE TENET ARPG
orientation / traversal / local terminals
       |
       v
Warm Thread World 001
finite human-world state + exact ACT
       |
       +--> success -> consequence
       |
       +--> refusal -> residue
                       |
                       v
                 future door
                       |
                       v
            GHoT owns recomposition
~~~

The browser imports the actual Full Measure Warm Thread reducer rather than
implementing a second authority model.

CI also checks out:

~~~text
the-static-collective/GHoT@tenetgram-040
~~~

and proves the game can open directly from the real GHoT Warm Thread and
TenetGram producers.

## Laws

~~~text
LOOKING != DOING
QUEST VISIBLE != QUEST REQUIRED
CAPABILITY != OBLIGATION
ACTOR STEP != FUTURE AUTHORITY
REFUSAL != DEFECT
RESIDUE != SCORE
WORLD CHANGE != XP
MAP != PUBLIC DISCOVERY
GAME PROJECTION != CANONICAL AUTHORITY
~~~

## What this slice does not claim

This is not yet:

- the live Telegram-authenticated player shell;
- multiplayer actor switching;
- a reLATTE-signed physical crossing;
- GPS/public map discovery;
- a reputation system;
- an economy;
- proof that any demo person or resource exists in the real world.

Those are separate membranes.

This slice proves something smaller and foundational:

> the existing architecture already behaves like a playable ARPG when its real
> consequence and authority boundaries are projected as a world.
