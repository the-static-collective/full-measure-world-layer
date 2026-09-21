import {
  cards,
  chooseFocus,
  drawQuestProposal,
  holdFocus,
  initialState,
  playCard,
  summarize
} from "./kernel.ts";
import {
  applyEconomyAction,
  availableActions,
  economyActions,
  initialCultureState,
  summarizeCulture
} from "./culture.ts";

const [command = "help", arg] = process.argv.slice(2);
let state = initialState();
let culture = initialCultureState();

function printHelp() {
  console.log(`
GRACE-001 — AN ORDINARY TUESDAY

Story / card commands:
  npm run grace -- status
  npm run grace -- draw [seed]
  npm run grace -- focus <morning|client-housing|vehicle>
  npm run grace -- play <card-id>
  npm run grace -- hold [reason]
  npm run grace -- cards

Culture / scarcity commands:
  npm run grace -- economy
  npm run grace -- choices
  npm run grace -- choose <economy-action-id>

This bounded CLI demonstrates one encounter from a fresh seed state per invocation.
It is a mechanics witness, not yet a persistent save game.
`);
}

switch (command) {
  case "status":
    console.log(summarize(state));
    break;
  case "draw":
    console.log(JSON.stringify(drawQuestProposal(state, Number(arg ?? 1)), null, 2));
    break;
  case "focus":
    if (!arg) throw new Error("focus requires a thread id");
    state = chooseFocus(state, arg);
    console.log(summarize(state));
    console.log(JSON.stringify(state.receipts.at(-1), null, 2));
    break;
  case "play":
    if (!arg) throw new Error("play requires a card id");
    if (arg === "relation.make-call") state = chooseFocus(state, "client-housing");
    state = playCard(state, arg);
    console.log(summarize(state));
    console.log(JSON.stringify(state.receipts.at(-1), null, 2));
    break;
  case "hold":
    state = holdFocus(state, arg ?? "held by player");
    console.log(summarize(state));
    console.log(JSON.stringify(state.receipts.at(-1), null, 2));
    break;
  case "cards":
    for (const card of Object.values(cards)) {
      console.log(`${card.id.padEnd(22)} [${card.deck}] ${card.title}\n  ${card.text}`);
    }
    break;
  case "economy":
    console.log(summarizeCulture(culture));
    break;
  case "choices":
    for (const action of availableActions(culture)) {
      console.log(`${action.id.padEnd(18)} ${action.label}\n  COST ${JSON.stringify(action.costs)}\n  ${action.note}`);
    }
    break;
  case "choose":
    if (!arg) throw new Error("choose requires an economy action id");
    if (!economyActions[arg]) throw new Error(`unknown economy action: ${arg}`);
    culture = applyEconomyAction(culture, arg);
    console.log(summarizeCulture(culture));
    console.log("\nOPPORTUNITY COST RECEIPT");
    console.log(JSON.stringify(culture.history.at(-1), null, 2));
    break;
  default:
    printHelp();
}
