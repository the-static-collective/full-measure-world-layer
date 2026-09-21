import {
  cards,
  chooseFocus,
  drawQuestProposal,
  holdFocus,
  initialState,
  playCard,
  summarize
} from "./kernel.ts";

const [command = "help", arg] = process.argv.slice(2);
let state = initialState();

function printHelp() {
  console.log(`
GRACE-001 — AN ORDINARY TUESDAY

Commands:
  npm run grace -- status
  npm run grace -- draw [seed]
  npm run grace -- focus <morning|client-housing|vehicle>
  npm run grace -- play <card-id>
  npm run grace -- hold [reason]
  npm run grace -- cards

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
  default:
    printHelp();
}
