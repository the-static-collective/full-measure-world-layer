import test from "node:test";
import assert from "node:assert/strict";
import {
  applyEconomyAction,
  availableActions,
  cultureUnlocks,
  demandPressure,
  initialCultureState
} from "../specimens/grace-001/culture.ts";

test("scarcity exposes hard opportunity cost instead of silently satisfying both meals", () => {
  const start = initialCultureState();
  assert.ok(availableActions(start).some((a) => a.id === "feed-home"));
  assert.ok(availableActions(start).some((a) => a.id === "share-meal"));

  const next = applyEconomyAction(start, "share-meal");
  const receipt = next.history.at(-1);
  assert.equal(next.stocks.food, 0);
  assert.ok(receipt?.opportunityCost.includes("feed-home"));

  const homeDinner = next.demands.find((d) => d.id === "home-dinner");
  const neighborMeal = next.demands.find((d) => d.id === "neighbor-meal");
  assert.equal(homeDinner?.met, 0);
  assert.equal(neighborMeal?.met, 1);
});

test("grocery run converts current scarcity into future food but spends cash transport time and attention", () => {
  const next = applyEconomyAction(initialCultureState(), "grocery-run");
  assert.deepEqual(next.stocks, { time: 2, cash: 0, food: 5, transport: 0, attention: 2 });
  const receipt = next.history.at(-1);
  assert.deepEqual(receipt?.consumed, { time: 2, cash: 18, transport: 1, attention: 1 });
  assert.deepEqual(receipt?.produced, { food: 4 });
});

test("meeting one demand leaves the residual demand ledger visible", () => {
  const start = initialCultureState();
  const before = demandPressure(start);
  const next = applyEconomyAction(start, "client-call");
  const after = demandPressure(next);
  assert.equal(after.total, before.total - 1);
  assert.ok(next.history.at(-1)?.residualDemands.includes("home-dinner"));
  assert.ok(next.history.at(-1)?.residualDemands.includes("rest"));
});

test("discipleship is formation, not a generated worker unit", () => {
  const next = applyEconomyAction(initialCultureState(), "teach-one-thing");
  assert.equal(next.traces.discipleship, 1);
  assert.ok(next.history.at(-1)?.nonClaims.includes("discipleship trace != ownership, obedience, or guaranteed future labor"));
  assert.deepEqual(cultureUnlocks(next), []);
});

test("culture patterns emerge only after repeated attributable choices", () => {
  let state = initialCultureState();
  // Give the fixture enough declared supply to repeat the same cultural act three times.
  state.stocks.time = 6;
  state.stocks.attention = 3;
  state = applyEconomyAction(state, "teach-one-thing");
  state = applyEconomyAction(state, "teach-one-thing");
  state = applyEconomyAction(state, "teach-one-thing");
  assert.ok(cultureUnlocks(state).includes("apprenticeship-pattern"));
});

test("an unaffordable action is refused rather than borrowing supply from nowhere", () => {
  const start = initialCultureState();
  const once = applyEconomyAction(start, "share-meal");
  assert.throws(() => applyEconomyAction(once, "feed-home"), /Cannot afford/);
});


test("prayer recharge spends finite time in the culture economy", () => {
  const start = initialCultureState();
  const next = applyEconomyAction(start, "prayer-block");
  assert.equal(next.stocks.time, start.stocks.time - 1);
  assert.equal(next.stocks.attention, start.stocks.attention + 1);
  assert.equal(next.traces.prayer, 1);
});
