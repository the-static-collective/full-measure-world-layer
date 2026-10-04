import {
  authorizeStep,
  attemptStep,
  exportWarmThreadResidue,
  openWarmThread,
  refuseStep,
} from "../warm-thread-world-001/warm-thread.mjs";

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const fail = (code, description) => ({ ok: false, code, description });

export const TENET_ARPG_FORMAT = "full-measure.tenet-arpg-state";
export const TENET_ARPG_VERSION = 1;

export const WORLD_NODES = Object.freeze({
  porch: {
    id: "porch",
    kind: "tenetgram",
    label: "Porch",
    x: 11,
    y: 82,
  },
  tree: {
    id: "tree",
    kind: "step",
    label: "Fallen ash",
    x: 24,
    y: 27,
    stepId: "release-tree",
    actor: "alice",
  },
  cutter: {
    id: "cutter",
    kind: "step",
    label: "Bob · cutter",
    x: 47,
    y: 19,
    stepId: "cut-tree",
    actor: "bob",
  },
  truck: {
    id: "truck",
    kind: "step",
    label: "Cara · pickup",
    x: 65,
    y: 55,
    stepId: "haul-load",
    actor: "cara",
  },
  house: {
    id: "house",
    kind: "step",
    label: "House · heat",
    x: 87,
    y: 23,
    stepId: "accept-delivery",
    actor: "david",
  },
  futureDoor: {
    id: "futureDoor",
    kind: "future-door",
    label: "Dormant future door",
    x: 83,
    y: 81,
  },
});

const STEP_NODE_BY_ID = Object.fromEntries(
  Object.values(WORLD_NODES)
    .filter(node => node.kind === "step")
    .map(node => [node.stepId, node.id]),
);

const DIRECTION_VECTORS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function distance(player, node) {
  const dx = player.x - node.x;
  const dy = player.y - node.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function validateTenetGram(tenetgram, fieldId) {
  if (!tenetgram || typeof tenetgram !== "object") {
    return fail("tenetgram-required", "A TenetGram is required.");
  }
  if (tenetgram.format !== "ghot.tenetgram" || tenetgram.version !== 1) {
    return fail("invalid-tenetgram", "Expected GHoT TenetGram v1.");
  }
  if (tenetgram.authority !== "carriage-only") {
    return fail("tenetgram-authority", "TenetGram may carry possibility only.");
  }
  if (
    tenetgram.automatic_delivery !== false ||
    tenetgram.automatic_notification !== false ||
    tenetgram.automatic_request !== false ||
    tenetgram.automatic_execution !== false
  ) {
    return fail("tenetgram-overclaim", "Automatic delivery/notification/request/execution is refused.");
  }
  const seeds = tenetgram.front?.seeds;
  if (!Array.isArray(seeds)) {
    return fail("tenetgram-seeds", "TenetGram has no seed list.");
  }
  const seed = seeds.find(
    item =>
      item?.format === "ghot.possibility-seed" &&
      item.version === 1 &&
      item.target_field === fieldId &&
      item.status === "dormant" &&
      item.authority === "possibility-only" &&
      item.notification_requested === false &&
      item.request_requested === false &&
      item.execution_requested === false,
  );
  if (!seed) {
    return fail("not-addressed", "No dormant possibility seed is addressed to this field.");
  }
  return { ok: true, seed: clone(seed) };
}

export function createGameState({
  warmThreadProposal,
  tenetgram,
  fieldId = "neighborhood-a",
} = {}) {
  const world = openWarmThread(warmThreadProposal);
  if (!world.ok) return world;

  const checked = validateTenetGram(tenetgram, fieldId);
  if (!checked.ok) return checked;

  return {
    ok: true,
    format: TENET_ARPG_FORMAT,
    version: TENET_ARPG_VERSION,
    fieldId,
    player: { x: WORLD_NODES.porch.x, y: WORLD_NODES.porch.y },
    world,
    seed: checked.seed,
    seedInspected: false,
    questVisible: false,
    futureDoor: null,
    terminal: "playing",
    history: [],
    counters: {
      xp: null,
      level: null,
      humanWorth: null,
    },
    laws: [
      "LOOKING != DOING",
      "QUEST VISIBLE != QUEST REQUIRED",
      "CAPABILITY != OBLIGATION",
      "ACTOR STEP != FUTURE AUTHORITY",
      "REFUSAL != DEFECT",
      "RESIDUE != SCORE",
      "WORLD CHANGE != XP",
    ],
  };
}

export function visibleNodes(state) {
  if (!state?.ok || state.format !== TENET_ARPG_FORMAT) return [];
  const nodes = [WORLD_NODES.porch];
  if (state.questVisible) {
    nodes.push(
      WORLD_NODES.tree,
      WORLD_NODES.cutter,
      WORLD_NODES.truck,
      WORLD_NODES.house,
    );
  }
  if (state.futureDoor) nodes.push(WORLD_NODES.futureDoor);
  return nodes.map(clone);
}

export function nearbyNode(state, radius = 13) {
  if (!state?.ok || state.format !== TENET_ARPG_FORMAT) return null;
  const candidates = visibleNodes(state)
    .map(node => ({ node, distance: distance(state.player, node) }))
    .filter(item => item.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.node ?? null;
}

export function movePlayer(state, direction, amount = 5) {
  if (!state?.ok || state.format !== TENET_ARPG_FORMAT) {
    return fail("not-open", "Open the Tenet ARPG world first.");
  }
  if (!(direction in DIRECTION_VECTORS)) {
    return fail("bad-direction", "Direction must be up/down/left/right.");
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 20) {
    return fail("bad-distance", "Movement amount must be between 0 and 20.");
  }

  const [dx, dy] = DIRECTION_VECTORS[direction];
  const next = clone(state);
  next.player = {
    x: clamp(next.player.x + dx * amount, 2, 98),
    y: clamp(next.player.y + dy * amount, 2, 98),
  };
  return next;
}

function requireNearby(state, nodeId) {
  const node = WORLD_NODES[nodeId];
  if (!node) return fail("unknown-node", "Unknown world node.");
  if (!visibleNodes(state).some(item => item.id === nodeId)) {
    return fail("node-hidden", "That world node is not visible yet.");
  }
  if (distance(state.player, node) > 14) {
    return fail("too-far", "Move closer before interacting.");
  }
  return { ok: true, node };
}

function appendHistory(state, event) {
  state.history.push({
    index: state.history.length,
    ...event,
  });
}

function makeFutureDoor(residue) {
  return {
    format: "full-measure.tenet-arpg-future-door-preview",
    version: 1,
    authority: "projection-only",
    sourceResidue: clone(residue),
    question: "What becomes possible next from this consequence?",
    status: "dormant",
    admitted: false,
    notified: false,
    requested: false,
    executed: false,
    note:
      "This is a game projection of the opening. GHoT owns canonical TenetGram emission.",
  };
}

export function availableCommands(state, nodeId) {
  if (!state?.ok || state.format !== TENET_ARPG_FORMAT) return [];
  const node = WORLD_NODES[nodeId];
  if (!node || !visibleNodes(state).some(item => item.id === nodeId)) return [];

  if (nodeId === "porch") {
    return state.seedInspected ? ["VIEW"] : ["INSPECT"];
  }

  if (nodeId === "futureDoor") {
    return ["INSPECT"];
  }

  if (node.kind === "step") {
    if (!state.questVisible || state.terminal !== "playing") return ["VIEW"];
    if (state.world.nextStep !== node.stepId) return ["VIEW"];
    if (node.stepId === "haul-load") return ["ACT", "REFUSE"];
    return ["ACT"];
  }

  return ["VIEW"];
}

export function takeGameAction(state, nodeId, command) {
  if (!state?.ok || state.format !== TENET_ARPG_FORMAT) {
    return fail("not-open", "Open the Tenet ARPG world first.");
  }

  const proximity = requireNearby(state, nodeId);
  if (!proximity.ok) return proximity;
  const allowed = availableCommands(state, nodeId);
  if (!allowed.includes(command)) {
    return fail(
      "command-unavailable",
      `${command} is not available at ${nodeId} in the current world state.`,
    );
  }

  const next = clone(state);
  const node = WORLD_NODES[nodeId];

  if (nodeId === "porch") {
    if (command === "INSPECT") {
      next.seedInspected = true;
      next.questVisible = true;
      appendHistory(next, {
        type: "seed-inspected",
        seedId: next.seed.seed_id,
        authority: "attention-only",
      });
    }
    return next;
  }

  if (nodeId === "futureDoor") {
    appendHistory(next, {
      type: "future-door-inspected",
      question: next.futureDoor.question,
      authority: "attention-only",
    });
    return next;
  }

  if (node.kind !== "step") return next;

  if (command === "REFUSE") {
    const refused = refuseStep(next.world, node.stepId, node.actor, "player chose refusal in Tenet ARPG specimen");
    if (!refused.ok) return refused;
    next.world = refused;
    const residue = exportWarmThreadResidue(refused);
    next.futureDoor = makeFutureDoor(residue);
    next.terminal = "held-residual";
    appendHistory(next, {
      type: "step-refused",
      stepId: node.stepId,
      actor: node.actor,
      humanWorthJudgment: null,
      score: null,
    });
    appendHistory(next, {
      type: "future-door-dropped",
      unresolvedRelation: residue.unresolvedRelation,
      authority: "projection-only",
    });
    return next;
  }

  if (command === "ACT") {
    const authorized = authorizeStep(next.world, node.stepId, node.actor, "ACT");
    if (!authorized.ok) return authorized;
    const attempted = attemptStep(authorized, node.stepId, node.actor, "SUCCEEDED");
    if (!attempted.ok) return attempted;
    next.world = attempted;
    appendHistory(next, {
      type: "step-succeeded",
      stepId: node.stepId,
      actor: node.actor,
      authorizationSpent: true,
    });

    if (attempted.phase === "completed") {
      next.terminal = "completed";
      const residue = exportWarmThreadResidue(attempted);
      next.futureDoor = makeFutureDoor(residue);
      appendHistory(next, {
        type: "world-consequence",
        result: "one-house-warm",
        worldChange: true,
        xp: null,
        level: null,
      });
      appendHistory(next, {
        type: "future-door-dropped",
        unresolvedRelation: null,
        authority: "projection-only",
      });
    }
    return next;
  }

  return next;
}

export function currentQuest(state) {
  if (!state?.ok || state.format !== TENET_ARPG_FORMAT) return null;
  if (!state.questVisible) {
    return {
      title: "No quest accepted",
      status: "orientation",
      text: "A dormant TenetGram is nearby. Looking is not doing.",
    };
  }

  if (state.world.phase === "completed") {
    return {
      title: "Warm the House",
      status: "completed",
      text: "One load was accepted for home heat. The world changed; no XP was minted.",
    };
  }

  if (state.world.phase === "held-residual") {
    return {
      title: "Warm the House",
      status: "held-residual",
      text: `Route held honestly. Missing: ${exportWarmThreadResidue(state.world).unresolvedRelation}.`,
    };
  }

  return {
    title: "Warm the House",
    status: state.world.phase,
    text: `Next bounded step: ${state.world.nextStep}.`,
  };
}

export function hudSnapshot(state) {
  if (!state?.ok || state.format !== TENET_ARPG_FORMAT) return null;
  return {
    quest: currentQuest(state),
    tree: state.world.resources.tree.state,
    cutterMinutes: state.world.resources.cutter.minutesAvailable,
    truckLoads: state.world.resources.truck.loadsAvailable,
    firewood: state.world.resources.firewood.state,
    heatNeed: state.world.need.status,
    xp: null,
    level: null,
    humanWorth: null,
  };
}
