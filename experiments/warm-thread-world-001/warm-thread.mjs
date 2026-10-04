const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const fail = (code, description) => ({ ok: false, code, description });
const clone = value => JSON.parse(JSON.stringify(value));

const STEP_ORDER = ['release-tree', 'cut-tree', 'haul-load', 'accept-delivery'];
const STEP_ACTORS = {
  'release-tree': 'alice',
  'cut-tree': 'bob',
  'haul-load': 'cara',
  'accept-delivery': 'david',
};
const STEP_KINDS = {
  'release-tree': 'release-resource',
  'cut-tree': 'transform-resource',
  'haul-load': 'transport-resource',
  'accept-delivery': 'accept-resource',
};
const GAP_BY_STEP = {
  'release-tree': 'firewood-feedstock',
  'cut-tree': 'cut-wood',
  'haul-load': 'haul-firewood',
  'accept-delivery': 'heat-home',
};
const FORBIDDEN = new Set(['score','rank','price','exchange_rate','common_unit','human_worth','automatic_execution']);

function scanForbidden(value) {
  if (Array.isArray(value)) {
    for (const item of value) if (scanForbidden(item)) return true;
    return false;
  }
  if (!plain(value)) return false;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN.has(key)) return true;
    if (scanForbidden(item)) return true;
  }
  return false;
}

function validProposal(source) {
  if (!plain(source) || source.format !== 'ghot.warm-thread-proposal' || source.version !== 1) return false;
  if (source.status !== 'composable' || source.authority !== 'proposal-only' || source.externalAuthority !== 'none') return false;
  if (source.sourceVerification !== 'self-declared-inputs-unverified') return false;
  if (scanForbidden(source)) return false;
  if (!plain(source.economics) || source.economics.required !== false || source.economics.settlement !== null || source.economics.universal_total !== null) return false;
  if (!plain(source.privacy) || source.privacy.exact_household_address !== 'withheld' || source.privacy.minimum_necessary_release !== true) return false;
  if (!plain(source.nonclaims) || Object.values(source.nonclaims).some(v => v !== false)) return false;
  if (!plain(source.requested_effect) || source.requested_effect.operation !== 'consider-warm-thread' || source.requested_effect.automatic_execution_requested !== false || source.requested_effect.automatic_location_release_requested !== false || source.requested_effect.automatic_settlement_requested !== false) return false;
  if (!Array.isArray(source.steps) || source.steps.length !== STEP_ORDER.length) return false;
  for (let i = 0; i < STEP_ORDER.length; i += 1) {
    const step = source.steps[i];
    if (!plain(step) || step.step_id !== STEP_ORDER[i] || step.actor !== STEP_ACTORS[STEP_ORDER[i]] || step.kind !== STEP_KINDS[STEP_ORDER[i]]) return false;
    if (step.authorization !== 'required-separately' || step.consumes_future_authority !== false) return false;
  }
  if (typeof source.warm_thread_id !== 'string' || !source.warm_thread_id.startsWith('warm-thread:')) return false;
  return true;
}

export function openWarmThread(source) {
  if (typeof source === 'string') {
    if (source.length > 131072) return fail('too-large', 'Warm Thread proposal exceeds 128 KiB.');
    try { source = JSON.parse(source); } catch { return fail('invalid-json', 'Invalid Warm Thread JSON.'); }
  }
  if (!validProposal(source)) return fail('invalid-proposal', 'Expected a bounded GHoT Warm Thread proposal with no execution authority.');

  return {
    ok: true,
    format: 'full-measure.warm-thread-world-preview',
    version: 1,
    sourceProposal: clone(source),
    warmThreadId: source.warm_thread_id,
    phase: 'offered',
    nextStep: 'release-tree',
    resources: {
      tree: { state: 'fallen-unreleased' },
      cutter: { minutesAvailable: 45 },
      truck: { loadsAvailable: 1, radiusMiles: 8 },
      firewood: { state: 'not-yet-produced' },
    },
    need: {
      kind: 'home-heat',
      status: 'open',
      urgency: 'tonight',
      exactAddress: 'withheld-from-shared-state',
    },
    stepState: Object.fromEntries(STEP_ORDER.map(id => [id, { status: 'pending', authorization: null }])),
    residue: [],
    worldAuthority: 'local-preview-only',
    sharedWorldChanged: false,
    humanWorthJudgment: null,
  };
}

export function authorizeStep(world, stepId, actor, phrase = 'ACT') {
  if (!world?.ok || world.format !== 'full-measure.warm-thread-world-preview') return fail('not-open', 'Open a Warm Thread world first.');
  if (world.phase === 'completed') return fail('completed', 'The Warm Thread is already complete.');
  if (world.phase === 'held-residual') return fail('held-residual', 'This route is held in residue; recompose before continuing.');
  if (world.nextStep !== stepId) return fail('wrong-step', 'Only the current step may be authorized.');
  if (STEP_ACTORS[stepId] !== actor) return fail('wrong-actor', 'This actor does not own the current step.');
  if (phrase !== 'ACT') return fail('act-required', 'Exact ACT is required.');
  const current = world.stepState?.[stepId];
  if (!current || current.status !== 'pending') return fail('not-pending', 'Current step is not pending.');

  const next = clone(world);
  const token = `${world.warmThreadId}:${stepId}:act:${world.residue.length}`;
  next.stepState[stepId] = { status: 'authorized', authorization: { token, actor, spent: false, oneAttempt: true } };
  return next;
}

function residualRecord(world, stepId, actor, outcome, note = null) {
  return {
    sequence: world.residue.length,
    stepId,
    actor,
    outcome,
    remainingNeed: world.need.status,
    recompositionGap: GAP_BY_STEP[stepId],
    note,
    humanWorthJudgment: null,
    authority: 'observation-only',
  };
}

export function attemptStep(world, stepId, actor, outcome = 'SUCCEEDED') {
  if (!world?.ok || world.format !== 'full-measure.warm-thread-world-preview') return fail('not-open', 'Open a Warm Thread world first.');
  if (!['SUCCEEDED', 'FAILED'].includes(outcome)) return fail('bad-outcome', 'Attempt outcome must be SUCCEEDED or FAILED.');
  if (world.phase === 'completed') return fail('completed', 'The Warm Thread is already complete.');
  if (world.phase === 'held-residual') return fail('held-residual', 'This route is held in residue; recompose before continuing.');
  if (world.nextStep !== stepId) return fail('wrong-step', 'Only the current step may be attempted.');
  if (STEP_ACTORS[stepId] !== actor) return fail('wrong-actor', 'This actor does not own the current step.');
  const current = world.stepState?.[stepId];
  if (!current || current.status !== 'authorized' || !current.authorization || current.authorization.spent) return fail('authorization-required', 'A fresh unspent authorization is required.');

  const next = clone(world);
  next.stepState[stepId].authorization.spent = true;

  if (outcome === 'FAILED') {
    next.stepState[stepId].status = 'failed';
    next.phase = 'held-residual';
    next.residue.push(residualRecord(world, stepId, actor, 'FAILED'));
    return next;
  }

  next.stepState[stepId].status = 'succeeded';
  if (stepId === 'release-tree') next.resources.tree.state = 'released-for-firewood';
  if (stepId === 'cut-tree') {
    next.resources.cutter.minutesAvailable = 0;
    next.resources.tree.state = 'transformed-to-cut-firewood';
    next.resources.firewood.state = 'cut-at-source';
  }
  if (stepId === 'haul-load') {
    next.resources.truck.loadsAvailable = 0;
    next.resources.firewood.state = 'at-delivery-boundary';
  }
  if (stepId === 'accept-delivery') {
    next.resources.firewood.state = 'accepted-for-home-heat';
    next.need.status = 'met-for-this-load';
  }

  next.residue.push(residualRecord(next, stepId, actor, 'SUCCEEDED'));
  const index = STEP_ORDER.indexOf(stepId);
  if (index === STEP_ORDER.length - 1) {
    next.nextStep = null;
    next.phase = 'completed';
  } else {
    next.nextStep = STEP_ORDER[index + 1];
    next.phase = 'in-progress';
  }
  return next;
}

export function refuseStep(world, stepId, actor, note = null) {
  if (!world?.ok || world.format !== 'full-measure.warm-thread-world-preview') return fail('not-open', 'Open a Warm Thread world first.');
  if (world.phase === 'completed') return fail('completed', 'The Warm Thread is already complete.');
  if (world.phase === 'held-residual') return fail('held-residual', 'This route is already held in residue.');
  if (world.nextStep !== stepId) return fail('wrong-step', 'Only the current step may be refused.');
  if (STEP_ACTORS[stepId] !== actor) return fail('wrong-actor', 'This actor does not own the current step.');

  const next = clone(world);
  next.stepState[stepId] = { status: 'refused', authorization: null };
  next.phase = 'held-residual';
  next.residue.push(residualRecord(world, stepId, actor, 'REFUSED', note));
  return next;
}

export function exportWarmThreadResidue(world) {
  if (!world?.ok || world.format !== 'full-measure.warm-thread-world-preview') return fail('not-open', 'Open a Warm Thread world first.');
  const completedSteps = STEP_ORDER.filter(id => world.stepState[id].status === 'succeeded');
  const unresolved = world.phase === 'completed' ? null : GAP_BY_STEP[world.nextStep] ?? world.residue.at(-1)?.recompositionGap ?? null;
  return {
    format: 'full-measure.warm-thread-residue',
    version: 1,
    warmThreadId: world.warmThreadId,
    phase: world.phase,
    completedSteps,
    unresolvedRelation: unresolved,
    remainingNeed: clone(world.need),
    resources: clone(world.resources),
    residue: clone(world.residue),
    authority: 'observation-only',
    humanWorthJudgment: null,
    score: null,
    sharedWorldChanged: false,
  };
}
