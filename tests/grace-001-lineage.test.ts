import test from "node:test";
import assert from "node:assert/strict";
import {
  enterUpperRoomFromDream,
  initialMeaningState,
  makePortableCardEnvelope,
  makeRememberedWordCard,
  recordRedDoorDream,
  seedDescendantFromEnvelope,
  upperRoomAnchors,
} from "../specimens/grace-001/meaning.ts";

test("Upper Room return uses player-selected declared anchor", () => {
  let state = recordRedDoorDream(initialMeaningState());
  state = enterUpperRoomFromDream(state, "dream.red-door.001", undefined, "ask-wisdom");
  assert.equal(state.returns[0].anchorId, "ask-wisdom");
  assert.equal(state.returns[0].scriptureAnchor, "James 1:5");
  assert.ok(state.returns[0].nonClaims.includes("anchor selection does not establish divine instruction"));
});

test("Upper Room anchor list contains references without forcing an interpretation", () => {
  assert.deepEqual(
    upperRoomAnchors.map((anchor) => anchor.scriptureAnchor),
    ["Psalm 46:10", "Matthew 11:28", "James 1:5"],
  );
});

test("portable card envelope seeds a generation-2 descendant with parent lineage", () => {
  let source = recordRedDoorDream(initialMeaningState());
  source = enterUpperRoomFromDream(source);
  source = makeRememberedWordCard(source, "upper-room.return.001");
  const parent = source.cards[0];
  const envelope = makePortableCardEnvelope(source, parent.id, "Grace", "Paula");

  const received = seedDescendantFromEnvelope(initialMeaningState(), envelope);
  const child = received.cards[0];

  assert.equal(child.generation, 2);
  assert.equal(child.parentCardId, parent.id);
  assert.deepEqual(child.lineage, [parent.id, child.id]);
  assert.ok(child.nonClaims.includes("descendant creation does not prove physical transfer of the parent card"));
});

test("receiving the same lineage envelope twice is idempotent", () => {
  let source = recordRedDoorDream(initialMeaningState());
  source = enterUpperRoomFromDream(source);
  source = makeRememberedWordCard(source, "upper-room.return.001");
  const envelope = makePortableCardEnvelope(source, source.cards[0].id, "Grace");

  let received = seedDescendantFromEnvelope(initialMeaningState(), envelope);
  received = seedDescendantFromEnvelope(received, envelope);
  assert.equal(received.cards.length, 1);
});
