import test from "node:test";
import assert from "node:assert/strict";
import {applyEconomyAction, initialCultureState} from "../specimens/grace-001/culture.ts";
import {
  receiptIntegerBudget,
  receiptOpportunityCost,
} from "../specimens/grace-001/dogramBridge.ts";

test("opportunity-cost witness retains before and after successor sets", () => {
  const before = initialCultureState();
  const after = applyEconomyAction(before, "share-meal");
  const witness = receiptOpportunityCost(before, after);

  assert.equal(witness.experiment, "GRACE-OPPORTUNITY-COST-001");
  assert.ok(witness.beforeActions.includes("feed-home"));
  assert.ok(!witness.afterActions.includes("feed-home"));
  assert.ok(witness.foreclosed.includes("feed-home"));
  assert.equal(witness.authority, "none");
});

test("Dogram-compatible budget receipt matches frozen 5:4:1 / budget 7 specimen", () => {
  const receipt = receiptIntegerBudget({a: 5, b: 4, c: 1}, 7);
  assert.deepEqual(receipt.exact, {a: "7/2", b: "14/5", c: "7/10"});
  assert.deepEqual(receipt.allocation, {a: 3, b: 3, c: 1});
  assert.deepEqual(receipt.residuals, {a: "-1/2", b: "1/5", c: "3/10"});
  assert.equal(receipt.allocatedTotal, 7);
  assert.equal(receipt.authority, "none");
});

test("same total budget can have explicit residual rather than fake exactness", () => {
  const receipt = receiptIntegerBudget({home: 2, work: 2, rest: 1}, 4);
  assert.equal(receipt.allocatedTotal, 4);
  assert.notDeepEqual(receipt.residuals, {home: "0", work: "0", rest: "0"});
});
