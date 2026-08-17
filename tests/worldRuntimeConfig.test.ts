import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';

import { resolveWorldRuntimeConfiguration } from '../src/world-runtime/config.js';

async function withDonorDirs(run: (dirs: { tranch: string; project0: string; corpus: string }) => Promise<void>) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'boot-house-config-'));
  const dirs = {
    tranch: path.join(root, 'tranchnode'),
    project0: path.join(root, 'project0'),
    corpus: path.join(root, 'corpus-os'),
  };
  for (const dir of Object.values(dirs)) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'package.json'), '{}\n', 'utf8');
  }
  try {
    await run(dirs);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('missing donor configuration is explicit and non-fatal', () => {
  const result = resolveWorldRuntimeConfiguration({});
  assert.equal(result.available, false);
  if (result.available) return;
  assert.equal(result.reasonCode, 'BOOT_HOUSE_DONOR_PATHS_REQUIRED');
  assert.equal(result.doors.length, 3);
  assert.equal(result.doors.every((door) => door.evidenceMode === 'fixture'), true);
});

test('unversioned source evidence cannot be marked verified/live', async () => {
  await withDonorDirs(async (dirs) => {
    const result = resolveWorldRuntimeConfiguration({
      BOOT_HOUSE_TRANCH_DIR: dirs.tranch,
      BOOT_HOUSE_PROJECT0_DIR: dirs.project0,
      BOOT_HOUSE_CORPUS_DIR: dirs.corpus,
      BOOT_HOUSE_SOURCE_VERSION_REF: 'github:the-static-collective/full-measure-world-layer@main',
    });
    assert.equal(result.available, false);
    if (result.available) return;
    assert.equal(result.reasonCode, 'BOOT_HOUSE_PINNED_SOURCE_REQUIRED');
  });
});

test('complete exact configuration produces command-backed runtime inputs without credentials', async () => {
  await withDonorDirs(async (dirs) => {
    const sha = 'a'.repeat(40);
    const result = resolveWorldRuntimeConfiguration({
      BOOT_HOUSE_TRANCH_DIR: dirs.tranch,
      BOOT_HOUSE_PROJECT0_DIR: dirs.project0,
      BOOT_HOUSE_CORPUS_DIR: dirs.corpus,
      BOOT_HOUSE_SOURCE_VERSION_REF: `github:the-static-collective/full-measure-world-layer@${sha}`,
      SOME_SECRET: 'must-not-leak',
    });

    assert.equal(result.available, true);
    if (!result.available) return;
    assert.equal(result.offeredWitnessRef, `github:the-static-collective/full-measure-world-layer@${sha}:README.md`);
    assert.equal(result.source.originVersionRef.endsWith(sha), true);
    assert.equal(result.source.sourceVerificationState, 'verified');
    assert.equal(result.doors.length, 3);
    assert.equal(result.commands.traversal.cwd, dirs.tranch);
    assert.equal(result.commands.encounter.cwd, dirs.project0);
    assert.equal(result.commands.destination.cwd, dirs.corpus);
    assert.equal(JSON.stringify(result).includes('must-not-leak'), false);
  });
});

test('configured donor path must point at a repository workspace', async () => {
  await withDonorDirs(async (dirs) => {
    await rm(path.join(dirs.project0, 'package.json'));
    const result = resolveWorldRuntimeConfiguration({
      BOOT_HOUSE_TRANCH_DIR: dirs.tranch,
      BOOT_HOUSE_PROJECT0_DIR: dirs.project0,
      BOOT_HOUSE_CORPUS_DIR: dirs.corpus,
      BOOT_HOUSE_SOURCE_VERSION_REF: `github:the-static-collective/full-measure-world-layer@${'b'.repeat(40)}`,
    });
    assert.equal(result.available, false);
    if (result.available) return;
    assert.equal(result.reasonCode, 'BOOT_HOUSE_DONOR_WORKSPACE_MISSING');
  });
});
