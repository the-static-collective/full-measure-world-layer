
import {
  WORLD_NODES,
  availableCommands,
  createGameState,
  currentQuest,
  hudSnapshot,
  movePlayer,
  nearbyNode,
  takeGameAction,
  visibleNodes,
} from "./game.mjs";
import { tenetgram, warmThreadProposal } from "./specimen.mjs";

let state = createGameState({
  warmThreadProposal,
  tenetgram,
  fieldId: "neighborhood-a",
});

if (!state.ok) throw new Error("Could not open Tenet ARPG specimen");

const root = document.querySelector("#game");

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function stepStatus(stepId) {
  return state.world.stepState[stepId]?.status ?? "pending";
}

function nodeGlyph(id) {
  return {
    porch: "◇",
    tree: "♠",
    cutter: "✦",
    truck: "▰",
    house: "⌂",
    futureDoor: "✧",
  }[id] ?? "•";
}

function move(direction) {
  const next = movePlayer(state, direction, 6);
  if (next.ok) state = next;
  render();
}

function act(command) {
  const near = nearbyNode(state);
  if (!near) return;
  const next = takeGameAction(state, near.id, command);
  if (next.ok) state = next;
  render();
}

function makeHeader() {
  const header = el("header", "masthead");
  const left = el("div");
  left.append(
    el("p", "eyebrow", "TENET ARPG · WORLD 001"),
    el("h1", "", "The Warm Thread"),
  );
  header.append(left, el("div", "world-law", "WORLD CHANGE ≠ XP"));
  return header;
}

function makeMap() {
  const quest = currentQuest(state);
  const wrap = el("section", "world-card");

  const topline = el("div", "world-card__topline");
  const title = el("div");
  title.append(
    el("p", "eyebrow", "Neighborhood A"),
    el("strong", "", quest.title),
  );
  topline.append(title, el("span", "quest-status", quest.status));

  const map = el("div", "world-map");
  map.tabIndex = 0;
  map.setAttribute("aria-label", "Playable Tenet ARPG field. Use W A S D or arrow keys.");

  const terrainA = el("div", "terrain terrain--ridge");
  const terrainB = el("div", "terrain terrain--road");
  const terrainC = el("div", "terrain terrain--grove");
  map.append(terrainA, terrainB, terrainC);

  for (const node of visibleNodes(state)) {
    const button = el("button", "world-node");
    button.type = "button";
    button.style.left = node.x + "%";
    button.style.top = node.y + "%";
    button.title = node.label;

    if (node.kind === "step") {
      button.classList.add("world-node--" + stepStatus(node.stepId));
      if (state.world.nextStep === node.stepId && state.terminal === "playing") {
        button.classList.add("world-node--current");
      }
    }
    if (node.kind === "future-door") button.classList.add("world-node--future");
    if (nearbyNode(state)?.id === node.id) button.classList.add("world-node--near");

    button.append(
      el("span", "world-node__glyph", nodeGlyph(node.id)),
      el("span", "world-node__label", node.label),
    );

    button.addEventListener("click", () => {
      const dx = node.x - state.player.x;
      const dy = node.y - state.player.y;
      let direction;
      if (Math.abs(dx) > Math.abs(dy)) direction = dx > 0 ? "right" : "left";
      else direction = dy > 0 ? "down" : "up";
      move(direction);
    });

    map.append(button);
  }

  const player = el("div", "player", "◆");
  player.style.left = state.player.x + "%";
  player.style.top = state.player.y + "%";
  map.append(player);

  const near = nearbyNode(state);
  map.append(
    el(
      "div",
      "map-caption",
      near ? "Nearby: " + near.label : "Walk until something becomes nearby.",
    ),
  );

  const bottom = el("div", "world-card__bottom");
  const dpad = el("div", "dpad");
  for (const [direction, glyph] of [
    ["up", "▲"],
    ["left", "◀"],
    ["down", "▼"],
    ["right", "▶"],
  ]) {
    const button = el("button", "", glyph);
    button.type = "button";
    button.setAttribute("aria-label", "Move " + direction);
    button.addEventListener("click", () => move(direction));
    dpad.append(button);
  }
  bottom.append(dpad, el("p", "", quest.text));

  wrap.append(topline, map, bottom);
  return wrap;
}

function makeEncounter() {
  const near = nearbyNode(state);
  const section = el("section", near ? "encounter" : "encounter encounter--quiet");
  section.append(el("p", "eyebrow", near ? "Nearby · " + near.kind : "Field"));

  if (!near) {
    section.append(
      el("h2", "", "Nothing is close enough to touch."),
      el("p", "", "Move through the field. A visible door is not a command."),
    );
    return section;
  }

  let title = near.label;
  let body = "Looking is not doing.";

  if (near.id === "porch") {
    title = state.seedInspected ? "The porch remembers" : "A dormant TenetGram";
    body = state.seedInspected
      ? "The Warm Thread remains optional."
      : state.seed.question;
  } else if (near.id === "futureDoor") {
    title = "A future door dropped here";
    body = state.futureDoor?.question ?? "What becomes possible next from this consequence?";
  } else if (near.kind === "step") {
    const status = stepStatus(near.stepId);
    if (status === "succeeded") body = "This step already happened. Old ACT cannot be reused.";
    else if (status === "refused") body = near.actor + " refused. Refusal is residue, not defect.";
    else if (state.world.nextStep === near.stepId) body = "Current step belongs to " + near.actor + ". ACT authorizes one attempt.";
    else body = "Visible, but not the current step.";
  }

  section.append(el("h2", "", title), el("p", "", body));

  const actions = el("div", "encounter__actions");
  for (const command of availableCommands(state, near.id)) {
    const button = el(
      "button",
      command === "REFUSE" ? "action-button action-button--secondary" : "action-button",
      command,
    );
    button.type = "button";
    button.addEventListener("click", () => act(command));
    actions.append(button);
  }
  section.append(actions, el("p", "boundary", "Looking is not doing · choice is local · no XP"));
  return section;
}

function makeLoadout() {
  const hud = hudSnapshot(state);
  const section = el("section", "loadout");
  section.append(
    el("p", "eyebrow", "World loadout"),
    el("h2", "", "What can actually move?"),
  );

  const grid = el("div", "loadout__grid");
  const rows = [
    ["Tree", hud.tree],
    ["Bob", String(hud.cutterMinutes) + " min"],
    ["Truck", String(hud.truckLoads) + " load"],
    ["Firewood", hud.firewood],
    ["Heat", hud.heatNeed],
    ["XP", "—"],
  ];
  for (const [label, value] of rows) {
    const item = el("div");
    item.append(el("span", "", label), el("strong", "", value));
    grid.append(item);
  }

  section.append(
    grid,
    el("p", "loadout__note", "Inventory means presently mobilizable state. It is not human worth."),
  );
  return section;
}

function historyText(event) {
  if (event.type === "seed-inspected") return "Door inspected. Quest visible; nothing accepted automatically.";
  if (event.type === "step-succeeded") return event.stepId + " succeeded. Its one ACT was spent.";
  if (event.type === "step-refused") return event.actor + " refused " + event.stepId + ". No score was created.";
  if (event.type === "future-door-dropped") return "Future door. Consequence changed the possibility surface.";
  if (event.type === "world-consequence") return "One house warm. World changed; XP remains null.";
  return event.type;
}

function makeHistory() {
  const section = el("section", "history");
  section.append(
    el("p", "eyebrow", "Receipts / residue"),
    el("h2", "", "What actually happened?"),
  );
  const list = el("ol");
  const events = state.history.slice(-6).reverse();
  if (events.length === 0) {
    const item = el("li", "history__empty", "No consequence yet. The field is only oriented.");
    list.append(item);
  } else {
    for (const event of events) list.append(el("li", "", historyText(event)));
  }
  section.append(list);
  return section;
}

function makeFooter() {
  const footer = el("footer", "footer-law");
  for (const law of [
    "QUEST VISIBLE ≠ QUEST REQUIRED",
    "CAPABILITY ≠ OBLIGATION",
    "REFUSAL ≠ DEFECT",
    "RESIDUE ≠ SCORE",
  ]) footer.append(el("span", "", law));
  return footer;
}

function render() {
  root.replaceChildren();
  const shell = el("main", "shell");
  const lower = el("section", "lower-grid");
  lower.append(makeEncounter(), makeLoadout(), makeHistory());
  shell.append(makeHeader(), makeMap(), lower, makeFooter());
  root.append(shell);
  root.querySelector(".world-map")?.focus({ preventScroll: true });
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
  move(direction);
});

render();
