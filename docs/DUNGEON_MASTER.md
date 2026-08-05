# Inherent Dungeon Master Contract

Full Measure needs a Dungeon Master, but not an omniscient AI ruler. The DM is a
bounded proposal protocol with an optional voice.

Its question is:

> Given the authorized state of the Garden, what might become playable next?

## Deterministic kernel

The `DungeonKernel` should construct an authorized snapshot from:

- open tensions;
- available gifts and capacities;
- active quests;
- prior lineage, rejected parallels, and unresolved branches;
- player-declared time, energy, boundaries, and desired intensity;
- explicit source receipts.

Held or private draft material is never included without a separate, explicit release.
The deterministic kernel must work offline so Full Measure remains playable with cards,
dice, or a local device and no model provider.

## Optional generative layer

A model may turn the authorized snapshot into several choices:

- **Spark** — a five-minute action;
- **Quest** — a bounded solo contribution;
- **Party Arc** — a shared undertaking.

`Rest`, `Hold`, and `Leave Open` remain legitimate choices. Each generated Quest Card
must show why it appeared, its source trail, required capacity, possible approaches,
return condition, eligible witnesses, and what remains unresolved.

Structurally, a generated quest is only a proposal:

```text
proposal
  responds_to  → tension
  depends_on   → gifts/capacities
  derived_from → authorized sources and receipts
```

Human acceptance moves it into Jubilee's existing participation lifecycle. The DM
must not create a competing quest ledger.

## Non-authority invariants

The DM may:

- reveal lawful options;
- vary flavor, route, weather, pacing, or optional complications;
- preserve tension and offer parallel approaches;
- narrate a chronicle after events are witnessed.

The DM may not:

- decide that an event occurred;
- infer consent, safety, virtue, guilt, or human worth;
- award Deeds, Harvests, capacity, reputation, or truth;
- convert private drafts into shared context;
- erase declined, held, rejected, or unresolved branches;
- let a random roll cross an authority boundary.

Dice can choose possibilities. Witnessed reality determines the record.

## First implementation target

Add **Draw the Next Quest** to the Garden:

1. assemble a deterministic, inspectable context packet;
2. offer three bounded choices plus Rest/Hold/Leave Open;
3. show the source and boundary explanation on each card;
4. let a person accept one choice through the existing pledge/project command;
5. record the proposal disposition and lineage;
6. keep all character-sheet changes downstream of human witness.

The DM should remain quiet until summoned or until an authorized event materially
changes the Garden.
