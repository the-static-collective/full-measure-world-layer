import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { openWarmThread, authorizeStep, attemptStep, refuseStep, exportWarmThreadResidue } from './warm-thread.mjs';

const ghotDir = process.env.GHOT_WARM_THREAD_DIR;
if (!ghotDir) {
  console.error('GHOT_WARM_THREAD_DIR is required');
  process.exit(2);
}

const run = spawnSync('python3', [resolve(ghotDir, 'ghot/warm_thread.py'), 'proposal'], { encoding: 'utf8' });
if (run.status !== 0) {
  process.stderr.write(run.stderr || 'GHoT producer failed\n');
  process.exit(run.status || 1);
}

let world = openWarmThread(run.stdout);
if (!world.ok) {
  console.error(JSON.stringify(world));
  process.exit(1);
}

function succeed(stepId, actor) {
  const authorized = authorizeStep(world, stepId, actor, 'ACT');
  if (!authorized.ok) {
    console.error(JSON.stringify(authorized));
    process.exit(1);
  }
  world = attemptStep(authorized, stepId, actor, 'SUCCEEDED');
  if (!world.ok) {
    console.error(JSON.stringify(world));
    process.exit(1);
  }
}

succeed('release-tree', 'alice');
succeed('cut-tree', 'bob');
world = refuseStep(world, 'haul-load', 'cara', 'truck unavailable after all');
if (!world.ok) {
  console.error(JSON.stringify(world));
  process.exit(1);
}

process.stdout.write(JSON.stringify(exportWarmThreadResidue(world), null, 2) + '\n');
