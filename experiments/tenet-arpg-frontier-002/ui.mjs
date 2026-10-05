
import {
  allFrontierNodes,
  applyWarmThreadAction,
  createFrontierState,
  frontierCommands,
  moveFrontierPlayer,
  nearbyFrontierNode,
  returnToFrontier,
  useFrontierCommand,
} from "./frontier.mjs";
import {
  graphFrontierWitness,
  mineralWitness,
  planzSenseRun,
  tenetgram,
  warmThreadProposal,
} from "./specimen.mjs";
import {
  availableCommands as warmCommands,
  movePlayer as moveWarmPlayer,
  nearbyNode as nearbyWarmNode,
  visibleNodes as visibleWarmNodes,
} from "../tenet-arpg-001/game.mjs";

let state = createFrontierState({
  warmThreadProposal,
  tenetgram,
  planzSenseRun,
  mineralWitness,
  graphFrontierWitness,
});

if (!state.ok) throw new Error("Could not open Tenet ARPG Frontier 002");

const root = document.querySelector("#game");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function glyph(kind) {
  return {
    "living-quest": "⌂",
    ruin: "⌁",
    mineral: "◆",
    "mineral-descendant": "◇",
    "frontier-parent": "Y",
    recombinant: "✦",
    "frontier-descendant": "↟",
    "emergent-possibility": "✧",
    tenetgram: "◇",
    step: "•",
    "future-door": "✧",
  }[kind] ?? "•";
}

function moveFrontier(direction) {
  const next = moveFrontierPlayer(state, direction, 6);
  if (next.ok) state = next;
  render();
}

function moveWarm(direction) {
  const moved = moveWarmPlayer(state.warmThread, direction, 6);
  if (moved.ok) state = { ...state, warmThread: moved };
  render();
}

function inspectText(node) {
  const data = node.inspection ?? {};
  if (node.kind === "ruin") {
    return [
      node.title,
      data.proposal,
      "Selection: " + data.selection,
      "Authority: " + data.authority,
    ];
  }
  if (node.kind === "mineral") {
    return [
      node.title,
      "Same verified seed; receiver-local meanings remain distinct.",
      "Math room: " + data.mathAction,
      "Terrain room: " + data.terrainAction,
    ];
  }
  if (node.kind === "mineral-descendant") {
    return [
      node.title,
      "Capability: " + data.capability,
      "Playable in its admitted locality: " + data.playableInNewLocality,
      "Executable here: false",
    ];
  }
  if (node.kind === "recombinant") {
    return [
      node.title,
      "Two parents remain real.",
      "Canonicalizes parents: " + data.canonicalizesParents,
      "Erases parents: " + data.erasesParents,
      "Inherited authority: " + data.inheritedAuthority,
    ];
  }
  if (node.kind === "frontier-descendant") {
    return [
      node.title,
      "Lineage mode: " + data.lineageMode,
      "Frontier parents: " + data.frontierParentCount,
      "Fresh admission happened there; no authority is imported here.",
    ];
  }
  if (node.kind === "emergent-possibility") {
    return [
      node.title,
      data.quest?.text ?? "",
      "Canonical TenetGram owner: " + data.canonicalTenetGramEmissionOwner,
    ];
  }
  if (node.kind === "living-quest") {
    return [
      node.title,
      node.subtitle,
      "This region owns actual bounded ACT/REFUSE gameplay.",
    ];
  }
  return [node.title, node.subtitle];
}

function makeDpad(onMove) {
  const pad = el("div", "dpad");
  for (const [direction, mark] of [
    ["up", "▲"],
    ["left", "◀"],
    ["down", "▼"],
    ["right", "▶"],
  ]) {
    const button = el("button", "", mark);
    button.type = "button";
    button.addEventListener("click", () => onMove(direction));
    pad.append(button);
  }
  return pad;
}

function renderFrontier() {
  const shell = el("main", "shell frontier-shell");
  const header = el("header", "masthead");
  const left = el("div");
  left.append(
    el("p", "eyebrow", "TENET ARPG 002 · THE FRONTIER"),
    el("h1", "", "The Edge of History"),
  );
  header.append(left, el("div", "world-law", "FRONTIER CHANGE ≠ XP"));
  shell.append(header);

  const card = el("section", "world-card");
  const top = el("div", "world-card__topline");
  const topLeft = el("div");
  topLeft.append(
    el("p", "eyebrow", "Consequential topology"),
    el("strong", "", "Walk what history made possible"),
  );
  top.append(topLeft, el("span", "quest-status", "frontier"));
  card.append(top);

  const map = el("div", "world-map frontier-map");
  map.tabIndex = 0;

  const nodes = allFrontierNodes(state);
  const byId = new Map(nodes.map(node => [node.id, node]));

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "frontier-edges");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  for (const [fromId, toId] of state.edges) {
    const from = byId.get(fromId);
    const to = byId.get(toId);
    if (!from || !to) continue;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(from.x));
    line.setAttribute("y1", String(from.y));
    line.setAttribute("x2", String(to.x));
    line.setAttribute("y2", String(to.y));
    line.setAttribute("class", "frontier-edge");
    svg.append(line);
  }
  map.append(svg);

  for (const node of nodes) {
    const button = el("button", "frontier-node frontier-node--" + node.kind);
    button.type = "button";
    button.style.left = node.x + "%";
    button.style.top = node.y + "%";
    if (nearbyFrontierNode(state)?.id === node.id) button.classList.add("is-nearby");
    if (state.selectedNodeId === node.id) button.classList.add("is-selected");
    button.append(
      el("span", "frontier-node__glyph", glyph(node.kind)),
      el("span", "frontier-node__label", node.title),
    );
    button.addEventListener("click", () => {
      const dx = node.x - state.player.x;
      const dy = node.y - state.player.y;
      const direction = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "right" : "left")
        : (dy > 0 ? "down" : "up");
      moveFrontier(direction);
    });
    map.append(button);
  }

  const player = el("div", "player frontier-player", "◆");
  player.style.left = state.player.x + "%";
  player.style.top = state.player.y + "%";
  map.append(player);

  const nearby = nearbyFrontierNode(state);
  map.append(
    el(
      "div",
      "map-caption",
      nearby ? "Nearby: " + nearby.title : "Walk the frontier. Most terrain is inspect-only.",
    ),
  );

  card.append(map);

  const bottom = el("div", "world-card__bottom");
  bottom.append(
    makeDpad(moveFrontier),
    el("p", "", "Ruins remember. Minerals verify. Branches recombine. Only owning regions authorize consequence."),
  );
  card.append(bottom);
  shell.append(card);

  const lower = el("section", "lower-grid frontier-lower");
  const encounter = el("section", "encounter");
  encounter.append(el("p", "eyebrow", nearby ? "Nearby · " + nearby.kind : "Frontier"));

  if (!nearby) {
    encounter.append(
      el("h2", "", "No terrain is close enough."),
      el("p", "", "Movement changes attention, not history."),
    );
  } else {
    encounter.append(
      el("h2", "", nearby.title),
      el("p", "", nearby.subtitle ?? ""),
    );
    const actions = el("div", "encounter__actions");
    for (const command of frontierCommands(state, nearby.id)) {
      const button = el("button", "action-button", command);
      button.type = "button";
      button.addEventListener("click", () => {
        const next = useFrontierCommand(state, nearby.id, command);
        if (next.ok) state = next;
        render();
      });
      actions.append(button);
    }
    encounter.append(actions);

    if (state.selectedNodeId === nearby.id) {
      const readout = el("div", "frontier-readout");
      for (const line of inspectText(nearby)) {
        readout.append(el("p", "", line));
      }
      encounter.append(readout);
    }
  }
  encounter.append(el("p", "boundary", "INSPECT ≠ SELECT · PLAYABLE THERE ≠ EXECUTABLE HERE"));

  const legend = el("section", "loadout");
  legend.append(
    el("p", "eyebrow", "Terrain classes"),
    el("h2", "", "One world, mixed authority"),
  );
  const grid = el("div", "loadout__grid");
  for (const [name, value] of [
    ["Living quest", "ACT / REFUSE"],
    ["Ruin", "inspect only"],
    ["Mineral", "verified object"],
    ["Recombinant", "multi-parent"],
    ["Future door", "projection only"],
    ["XP", "—"],
  ]) {
    const item = el("div");
    item.append(el("span", "", name), el("strong", "", value));
    grid.append(item);
  }
  legend.append(grid);

  const receipts = el("section", "history");
  receipts.append(
    el("p", "eyebrow", "Frontier receipts"),
    el("h2", "", "What did attention change?"),
  );
  const list = el("ol");
  if (state.inspections.length === 0) {
    list.append(el("li", "history__empty", "Nothing inspected yet."));
  } else {
    for (const entry of state.inspections.slice(-6).reverse()) {
      list.append(el("li", "", entry.kind + " inspected · no selection · no execution"));
    }
  }
  receipts.append(list);

  lower.append(encounter, legend, receipts);
  shell.append(lower);

  const laws = el("footer", "footer-law");
  for (const law of [
    "RUIN ≠ QUEST",
    "VERIFIED MINERAL ≠ LOCAL VALUE",
    "RECOMBINATION ≠ CANON",
    "CONSEQUENCE MAY CHANGE FRONTIER",
  ]) laws.append(el("span", "", law));
  shell.append(laws);

  root.replaceChildren(shell);
  map.focus({ preventScroll: true });
}

function warmNodeText(node) {
  if (node.id === "porch") return state.warmThread.seedInspected ? "Porch remembered" : "Dormant TenetGram";
  if (node.kind === "step") return node.label;
  if (node.kind === "future-door") return "Future door";
  return node.label;
}

function renderWarmThread() {
  const shell = el("main", "shell");
  const header = el("header", "masthead");
  const left = el("div");
  left.append(
    el("p", "eyebrow", "LIVING REGION · WARM THREAD"),
    el("h1", "", "Warm the House"),
  );
  const back = el("button", "return-button", "← Return to frontier");
  back.type = "button";
  back.addEventListener("click", () => {
    const next = returnToFrontier(state);
    if (next.ok) state = next;
    render();
  });
  header.append(left, back);
  shell.append(header);

  const card = el("section", "world-card");
  const map = el("div", "world-map");
  map.tabIndex = 0;

  for (const node of visibleWarmNodes(state.warmThread)) {
    const button = el("button", "world-node");
    button.type = "button";
    button.style.left = node.x + "%";
    button.style.top = node.y + "%";
    if (nearbyWarmNode(state.warmThread)?.id === node.id) button.classList.add("world-node--near");
    if (node.kind === "step" && state.warmThread.world.nextStep === node.stepId) {
      button.classList.add("world-node--current");
    }
    button.append(
      el("span", "world-node__glyph", glyph(node.kind)),
      el("span", "world-node__label", warmNodeText(node)),
    );
    map.append(button);
  }

  const player = el("div", "player", "◆");
  player.style.left = state.warmThread.player.x + "%";
  player.style.top = state.warmThread.player.y + "%";
  map.append(player);

  const near = nearbyWarmNode(state.warmThread);
  map.append(el("div", "map-caption", near ? "Nearby: " + warmNodeText(near) : "Walk the living region."));
  card.append(map);

  const bottom = el("div", "world-card__bottom");
  bottom.append(
    makeDpad(moveWarm),
    el("p", "", "Each ACT belongs to one local actor and one attempt."),
  );
  card.append(bottom);
  shell.append(card);

  const encounter = el("section", "encounter warm-encounter");
  encounter.append(el("p", "eyebrow", near ? "Nearby · living consequence" : "Field"));
  if (near) {
    encounter.append(el("h2", "", warmNodeText(near)));
    const actions = el("div", "encounter__actions");
    for (const command of warmCommands(state.warmThread, near.id)) {
      if (command === "VIEW") continue;
      const button = el(
        "button",
        command === "REFUSE" ? "action-button action-button--secondary" : "action-button",
        command,
      );
      button.type = "button";
      button.addEventListener("click", () => {
        const next = applyWarmThreadAction(state, near.id, command);
        if (next.ok) state = next;
        render();
      });
      actions.append(button);
    }
    encounter.append(actions);
  } else {
    encounter.append(el("h2", "", "Move closer."));
  }
  encounter.append(el("p", "boundary", "LOOKING ≠ DOING · ACTOR STEP ≠ FUTURE AUTHORITY"));
  shell.append(encounter);

  root.replaceChildren(shell);
  map.focus({ preventScroll: true });
}

function render() {
  if (state.mode === "warm-thread") renderWarmThread();
  else renderFrontier();
}

window.addEventListener("keydown", event => {
  const directions = {
    w: "up",
    W: "up",
    ArrowUp: "up",
    s: "down",
    S: "down",
    ArrowDown: "down",
    a: "left",
    A: "left",
    ArrowLeft: "left",
    d: "right",
    D: "right",
    ArrowRight: "right",
  };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  if (state.mode === "frontier") moveFrontier(direction);
  else moveWarm(direction);
});

render();
