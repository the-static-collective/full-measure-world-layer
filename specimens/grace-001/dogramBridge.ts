import {availableActions, type CultureState} from "./culture.ts";

export interface OpportunityCostWitness {
  experiment: "GRACE-OPPORTUNITY-COST-001";
  beforeActions: string[];
  afterActions: string[];
  foreclosed: string[];
  newlyAvailable: string[];
  retained: string[];
  authority: "none";
  nonClaims: string[];
}

export function receiptOpportunityCost(
  before: CultureState,
  after: CultureState
): OpportunityCostWitness {
  const beforeActions = availableActions(before).map((action) => action.id).sort();
  const afterActions = availableActions(after).map((action) => action.id).sort();
  const beforeSet = new Set(beforeActions);
  const afterSet = new Set(afterActions);

  return {
    experiment: "GRACE-OPPORTUNITY-COST-001",
    beforeActions,
    afterActions,
    foreclosed: beforeActions.filter((id) => !afterSet.has(id)),
    newlyAvailable: afterActions.filter((id) => !beforeSet.has(id)),
    retained: beforeActions.filter((id) => afterSet.has(id)),
    authority: "none",
    nonClaims: [
      "foreclosed action != morally preferred alternative",
      "available successor != occurred successor",
      "same available-action set != same underlying state",
      "mechanics witness != evidence about real-world human worth or obligation"
    ]
  };
}

export interface BudgetRoundingWitness {
  experiment: "BUDGET-ROUNDING-RESIDUAL-001";
  method: "largest_fractional_remainder";
  budget: number;
  weights: Record<string, number>;
  exact: Record<string, string>;
  allocation: Record<string, number>;
  residuals: Record<string, string>;
  allocatedTotal: number;
  authority: "none";
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) [x, y] = [y, x % y];
  return x || 1;
}

function fractionText(numerator: number, denominator: number): string {
  const divisor = gcd(numerator, denominator);
  const n = numerator / divisor;
  const d = denominator / divisor;
  return d === 1 ? String(n) : `${n}/${d}`;
}

export function receiptIntegerBudget(
  weights: Record<string, number>,
  budget: number
): BudgetRoundingWitness {
  const labels = Object.keys(weights);
  if (labels.length === 0) throw new Error("weights must be non-empty");
  if (!Number.isInteger(budget) || budget < 0) throw new Error("budget must be a non-negative integer");
  if (labels.some((label) => !Number.isInteger(weights[label]) || weights[label] <= 0)) {
    throw new Error("weights must be positive integers");
  }

  const totalWeight = labels.reduce((sum, label) => sum + weights[label], 0);
  const allocation: Record<string, number> = {};
  const exact: Record<string, string> = {};
  const residuals: Record<string, string> = {};

  const fractions = labels.map((label) => {
    const numerator = budget * weights[label];
    const floor = Math.floor(numerator / totalWeight);
    allocation[label] = floor;
    exact[label] = fractionText(numerator, totalWeight);
    return {label, numerator, floor, remainder: numerator - floor * totalWeight};
  });

  let remaining = budget - Object.values(allocation).reduce((sum, value) => sum + value, 0);
  fractions.sort((a, b) => b.remainder - a.remainder || a.label.localeCompare(b.label));

  for (const item of fractions) {
    if (remaining <= 0) break;
    allocation[item.label] += 1;
    remaining -= 1;
  }

  for (const label of labels) {
    const residualNumerator = allocation[label] * totalWeight - budget * weights[label];
    residuals[label] = fractionText(residualNumerator, totalWeight);
  }

  return {
    experiment: "BUDGET-ROUNDING-RESIDUAL-001",
    method: "largest_fractional_remainder",
    budget,
    weights: Object.fromEntries(labels.sort().map((label) => [label, weights[label]])),
    exact: Object.fromEntries(labels.sort().map((label) => [label, exact[label]])),
    allocation: Object.fromEntries(labels.sort().map((label) => [label, allocation[label]])),
    residuals: Object.fromEntries(labels.sort().map((label) => [label, residuals[label]])),
    allocatedTotal: Object.values(allocation).reduce((sum, value) => sum + value, 0),
    authority: "none"
  };
}
