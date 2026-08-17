import { readFile, writeFile } from 'node:fs/promises';

const file = 'server.ts';
let source = await readFile(file, 'utf8');

const importAnchor = "import { authorizePledgeTransition } from './src/lib/pledgeAuthority.js';";
const importLine = "import { createWorldRuntimeApi } from './src/world-runtime/bootstrap.js';";
if (!source.includes(importLine)) {
  if (!source.includes(importAnchor)) throw new Error('server import anchor not found');
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const jsonAnchor = '  app.use(express.json());';
const mount = `  app.use('/api/world', createWorldRuntimeApi({\n    env: process.env,\n    resolveActorId: getActorId,\n  }));`;
if (!source.includes(mount)) {
  if (!source.includes(jsonAnchor)) throw new Error('express json anchor not found');
  source = source.replace(jsonAnchor, `${jsonAnchor}\n${mount}`);
}

await writeFile(file, source, 'utf8');
