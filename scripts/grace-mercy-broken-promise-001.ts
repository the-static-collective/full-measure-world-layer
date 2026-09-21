import { runGraceMercyBrokenPromiseSpecimen } from '../src/lib/graceMercy/specimen.js';

const result = runGraceMercyBrokenPromiseSpecimen();

console.log('GRACE-MERCY-BROKEN-PROMISE-001');
for (const event of result.events) console.log(`event ${event.id} ${event.eventType}`);
console.log(`final_sheet ${result.receipt.endingSheet}`);
console.log(`discernment ${result.receipt.discernment}`);
console.log(`disposition ${result.receipt.disposition}`);
console.log(`boundary ${result.receipt.boundaries[0] ?? 'none'}`);
console.log(`intent ${result.receipt.unknowns.includes('intent_unknown') ? 'UNKNOWN' : 'resolved'}`);
console.log(`receipt ${result.receipt.receiptHash}`);
