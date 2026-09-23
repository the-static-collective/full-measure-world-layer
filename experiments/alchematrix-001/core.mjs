// ALCHEMATRIX-001: isolated fictional, deterministic crafting specimen.
// No project-owned source repo is imported; no real-world authority is claimed.
export const WORLD = Object.freeze({
  prismA: Object.freeze({ id: 'prismA', frequency: 3 }),
  prismB: Object.freeze({ id: 'prismB', frequency: 7 }),
});
export const initialState = () => ({
  inventory: { quartz: 0, copper: 0, echo: 0 },
  telescope: null, bench: { instruments: [] },
  observations: {}, artifact: null, doorOpen: false,
  events: [], last: 'The observatory is quiet. The two prisms look the same.'
});
function requireThat(predicate, message) { if (!predicate) throw new Error(message); }
const COSTS = Object.freeze({telescope: {quartz: 1, copper: 1}, probe: {quartz: 1, copper: 1}, memory: {echo: 1}});
function pay(s, cost) {
  for (const [item, amount] of Object.entries(cost)) requireThat(s.inventory[item] >= amount, `Need ${amount} ${item}.`);
  for (const [item, amount] of Object.entries(cost)) s.inventory[item] -= amount;
}
export function benchCapabilities(s) {
  // Only the transferred, separately constituted instrument grants bench functions.
  return [...new Set(s.bench.instruments.flatMap(i => i.capabilities))].sort();
}
export function step(state, action) {
  const s = structuredClone(state);
  const {type, item, target} = action;
  let note, evidence = 'fictional-local';
  switch(type) {
    case 'mine':
      requireThat(['quartz', 'copper', 'echo'].includes(item), 'Unknown ore.');
      s.inventory[item] += 1; note = `Collected one ${item}.`; break;
    case 'craft-telescope':
      requireThat(!s.telescope, 'The telescope already exists.');
      pay(s, COSTS.telescope);
      s.telescope = {id: 'telescope-001', capabilities: ['sight'], version: 1};
      note = 'Crafted a basic telescope. It cannot yet separate the prisms.'; break;
    case 'install-probe':
      requireThat(s.telescope, 'Craft a telescope first.');
      requireThat(!s.telescope.capabilities.includes('frequency-probe'), 'Probe is already installed.');
      pay(s, COSTS.probe); s.telescope.capabilities.push('frequency-probe'); s.telescope.version++;
      note = 'Installed the frequency probe. The telescope now distinguishes the two prisms.'; break;
    case 'install-memory':
      requireThat(s.telescope, 'Craft a telescope first.');
      requireThat(!s.telescope.capabilities.includes('memory-receipt'), 'Memory is already installed.');
      pay(s, COSTS.memory); s.telescope.capabilities.push('memory-receipt'); s.telescope.version++;
      note = 'Installed the memory vessel. Future observations can retain local receipts.'; break;
    case 'observe': {
      requireThat(s.telescope, 'You need a telescope to observe.');
      requireThat(Object.hasOwn(WORLD, target), 'Unknown target.');
      const probe = s.telescope.capabilities.includes('frequency-probe');
      const memory = s.telescope.capabilities.includes('memory-receipt');
      const signature = probe ? `frequency:${WORLD[target].frequency}` : 'indistinguishable';
      evidence = probe ? 'simulated-probe' : 'unseparated-visual';
      note = `${target}: ${signature}${memory ? ' (retained as an observer-local receipt)' : ' (no memory vessel installed)'}.`;
      if (probe && memory) s.observations[target] = {target, signature, instrument: s.telescope.id,
        instrumentVersion: s.telescope.version, receiptId: `local-${s.events.length + 1}`};
      break;
    }
    case 'socket-telescope': {
      requireThat(s.telescope, 'No telescope available.');
      requireThat(s.telescope.capabilities.includes('frequency-probe') && s.telescope.capabilities.includes('memory-receipt'), 'Install probe and memory first.');
      requireThat(Object.keys(s.observations).length === 2, 'Retain observations of both prisms first.');
      requireThat(s.observations.prismA.signature !== s.observations.prismB.signature, 'Observations must distinguish the prisms.');
      s.bench.instruments.push(structuredClone(s.telescope));
      s.telescope = null;
      note = 'Socketed the observed telescope into the bench. Its bounded capabilities are now bench inputs.'; break;
    }
    case 'craft-question-key': {
      const caps = benchCapabilities(s);
      requireThat(!s.artifact, 'The key already exists.');
      requireThat(caps.includes('frequency-probe') && caps.includes('memory-receipt'), 'The bench lacks the required instrument capabilities.');
      requireThat(s.observations.prismA?.signature !== s.observations.prismB?.signature && !!s.observations.prismA && !!s.observations.prismB, 'Two distinct retained observations are required.');
      s.artifact = {id:'question-key-001', constructor:'workbench+socketed-telescope',
        dependsOn: ['telescope-001',s.observations.prismA.receiptId,s.observations.prismB.receiptId]};
      note = 'The upgraded bench crafted a Question Key from an instrument and two distinct witnessed signals.'; break;
    }
    case 'open-door':
      requireThat(s.artifact, 'A Question Key is required.');
      requireThat(!s.doorOpen, 'The door is already open.');
      s.doorOpen = true;
      note = 'The door opens. A second observatory asks: who taught its instruments to remember?'; break;
    default: throw new Error(`Unknown action: ${type}`);
  }
  s.last = note;
  s.events.push({id: `local-${s.events.length + 1}`, action: structuredClone(action),
    evidenceClass: evidence, result:note, nonClaims:['not a physical-world witness','not imported into project canon']});
  return s;
}

