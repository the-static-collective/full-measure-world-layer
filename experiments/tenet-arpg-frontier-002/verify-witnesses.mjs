
#!/usr/bin/env node
import fs from "node:fs";
import {
  terrainFromGraphFrontierWitness,
  terrainFromMineralWitness,
  terrainFromPlanZSenses,
} from "./frontier.mjs";

const [planzPath, graphPath, mineralPath] = process.argv.slice(2);
if (!planzPath || !graphPath || !mineralPath) {
  console.error("usage: node verify-witnesses.mjs <planz.json> <graph.json> <mineral.json>");
  process.exit(2);
}

function read(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

const planz = terrainFromPlanZSenses(read(planzPath));
const graph = terrainFromGraphFrontierWitness(read(graphPath));
const mineral = terrainFromMineralWitness(read(mineralPath));

for (const [name, result] of [["planz", planz], ["graph", graph], ["mineral", mineral]]) {
  if (!result.ok) {
    console.error(JSON.stringify({ name, result }, null, 2));
    process.exit(1);
  }
}

const out = {
  schema: "full-measure.tenet-arpg-frontier-live-witness/v0",
  ruins: planz.ruins.length,
  graph_nodes: graph.nodes.length,
  graph_edges: graph.edges.length,
  mineral_nodes: mineral.nodes.length,
  imported_authority: "none",
  imported_execution_authority: false,
  laws: [
    "SENSE != CHOICE",
    "RUIN != QUEST",
    "VERIFIED MINERAL != LOCAL VALUE",
    "RECOMBINATION != CANON",
    "PLAYABLE THERE != EXECUTABLE HERE",
  ],
};

process.stdout.write(JSON.stringify(out, null, 2) + "\n");
