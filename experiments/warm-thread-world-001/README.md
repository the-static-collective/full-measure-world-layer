# Warm Thread World 001 — Pocket-Sized Promise

A bounded Full Measure world receiver for GHoT Warm Thread 039.

This experiment asks whether a composed useful path can enter an inhabited
human world without becoming authority merely because the path exists.

## Cross-repo path

~~~text
GHoT Warm Thread 039
  HAVE tree
  CAN cut
  CAN haul
  NEED heat
      |
      | proposal only
      v
Full Measure Warm Thread World 001
      |
      +-- Alice ACT -> release-tree attempt
      +-- Bob ACT   -> cut-tree attempt
      +-- Cara ACT  -> haul-load attempt
      +-- David ACT -> accept-delivery attempt
      |
      v
world consequence / honest residue
~~~

The receiver rejects a source that claims automatic execution, exposes the
household address, introduces a hidden price/score/rank/common unit, or upgrades
any source nonclaim into verified fact.

## Finite life

The frozen world begins with:

~~~text
fallen tree          = unreleased
Bob cutting capacity = 45 minutes
Cara truck capacity  = one load / eight-mile radius
David heat need      = open / tonight
exact address        = withheld from shared state
~~~

A successful cutting attempt consumes the 45-minute capacity. A successful haul
consumes the one-load capacity. The final acceptance resolves only this one
declared heat need.

## A stride contains no future authority

Every step requires a fresh local ACT by the actor who owns that step.

~~~text
Alice ACT != Bob ACT
Bob ACT   != Cara ACT
Cara ACT  != David ACT
~~~

An authorization is one attempt, not permission until success.

## Refusal and failure become residue

If Cara refuses after the tree has been released and cut:

~~~text
tree/firewood state = cut-at-source
heat need           = open
unresolved relation = haul-firewood
Cara score          = none
human-worth verdict = none
~~~

The route stops honestly. The residue can become a future GHoT recomposition
input without turning refusal into defect.

## Run

~~~bash
node --test experiments/warm-thread-world-001/tests/*.test.mjs
~~~

With a GHoT checkout:

~~~bash
GHOT_WARM_THREAD_DIR=/path/to/GHoT \
  node --test experiments/warm-thread-world-001/tests/*.test.mjs
~~~

CI checks out the real `warm-thread-039` producer branch and runs the consumer
against its emitted proposal.

## Laws

~~~text
POSSIBILITY != AUTHORITY
CAPACITY != OBLIGATION
NEED != ENTITLEMENT
ONE STEP != FUTURE AUTHORITY
REFUSAL != DEFECT
FAILURE != HISTORY ERASURE
RESIDUE != SCORE
WORLD CONSEQUENCE != ECONOMIC VALUATION
~~~

## Next aperture

Return the Full Measure residue to GHoT and prove recomposition from the exact
remaining world state:

~~~text
cut firewood at source
+ household still needs heat
+ Cara declined
      |
      v
new WANT: haul-firewood
      |
      v
new candidate door
~~~

Only after that loop closes should Twilio become an ordinary-human door for
HAVE / NEED / CAN messages.
