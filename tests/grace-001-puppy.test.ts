import test from "node:test";
import assert from "node:assert/strict";
import {appendEvent,emptySession} from "../specimens/grace-001/session.ts";
import {
  startWednesday,replayWednesday,playWednesdayAction,
  availableWednesdayActions,offerPuppyCare,respondToPuppyCare,
  derivePuppyArrivalOffer,derivePuppyInterrupt,
} from "../specimens/grace-001/tomorrow.ts";
function day() {
  let t=emptySession();
  t=appendEvent(t,{type:"economy_action",actionId:"grocery-run"});
  t=appendEvent(t,{type:"economy_action",actionId:"rest-block"});
  return startWednesday(t);
}
test("puppy appears after Wednesday gets going and declining it leaves care unassigned",()=>{
  let w=day();
  assert.equal(derivePuppyArrivalOffer(w),null);
  w=playWednesdayAction(w,"pray-wednesday");
  assert.equal(derivePuppyArrivalOffer(w)?.id,"puppy-at-the-door");
  const declined=offerPuppyCare(w,"decline");
  assert.equal(replayWednesday(declined).puppy.status,"declined");
  assert.equal(derivePuppyInterrupt(declined),null);
  assert.equal(derivePuppyArrivalOffer(declined),null);
});
test("accepted puppy brings distinct supplies but never increases human food",()=>{
  let w=playWednesdayAction(day(),"pray-wednesday");
  const before=replayWednesday(w);
  w=offerPuppyCare(w,"temporary-care");
  const after=replayWednesday(w);
  assert.equal(after.puppy.status,"visiting");
  assert.equal(after.puppy.kitMeals,1);
  assert.equal(after.stocks.food,before.stocks.food);
  assert.equal(after.puppy.care,"not_due");
  assert.ok(after.receipts.at(-1)?.nonClaims.includes("temporary care != permanent ownership"));
});
test("puppy wild card interrupts after one later act and makes concrete care due",()=>{
  let w=playWednesdayAction(day(),"pray-wednesday");
  w=offerPuppyCare(w,"temporary-care");
  assert.equal(derivePuppyInterrupt(w),null);
  w=playWednesdayAction(w,"pray-wednesday");
  assert.equal(derivePuppyInterrupt(w)?.id,"puppy-needs-outside");
  assert.deepEqual(availableWednesdayActions(w),[]);
  assert.throws(()=>playWednesdayAction(w,"pray-wednesday"),/puppy care response required/);
  const next=respondToPuppyCare(w,"porch");
  const state=replayWednesday(next);
  assert.equal(state.puppy.care,"settled");
  assert.equal(state.puppy.kitMeals,0);
  assert.equal(state.stocks.food,replayWednesday(w).stocks.food);
  assert.equal(state.stocks.time,replayWednesday(w).stocks.time-1);
  assert.ok(state.receipts.at(-1)?.nonClaims.includes("care receipt != puppy consent, ownership, or guaranteed affection"));
});
test("dog park requires a real transport unit and makes only a candidate encounter",()=>{
  let w=playWednesdayAction(day(),"pray-wednesday");
  w=offerPuppyCare(w,"temporary-care");
  w=playWednesdayAction(w,"pray-wednesday");
  const before=replayWednesday(w);
  w=respondToPuppyCare(w,"dog-park");
  const after=replayWednesday(w);
  assert.equal(after.stocks.transport,before.stocks.transport-1);
  assert.equal(after.puppy.care,"settled");
  assert.ok(after.receipts.at(-1)?.claims.includes("a possible dog-park conversation was noticed, not established"));
  assert.throws(()=>respondToPuppyCare(w,"porch"),/not currently due/);
});
test("when ordinary time is exhausted, urgent puppy care creates explicit next-day time debt rather than neglect",()=>{
  let w=playWednesdayAction(day(),"pray-wednesday");
  w=offerPuppyCare(w,"temporary-care");
  w=playWednesdayAction(w,"rest-wednesday");
  const due=derivePuppyInterrupt(w);
  assert.equal(due?.id,"puppy-needs-outside");
  assert.equal(replayWednesday(w).stocks.time,0);
  w=respondToPuppyCare(w,"porch");
  const state=replayWednesday(w);
  assert.equal(state.stocks.time,0);
  assert.equal(state.puppy.timeDebt,1);
  assert.equal(state.puppy.care,"settled");
  assert.ok(state.receipts.at(-1)?.nonClaims.includes("next-day time debt != free time or a completed future-day action"));
});
test("replay refuses spontaneous puppy care and forged puppy encounters",()=>{
  let w=day();
  assert.throws(()=>offerPuppyCare(w,"temporary-care"),/not currently available/);
  w=playWednesdayAction(w,"pray-wednesday");
  w=offerPuppyCare(w,"temporary-care");
  assert.throws(()=>respondToPuppyCare(w,"porch"),/not currently due/);
  const bad={...w,events:[...w.events,{id:"wed-event-0003",type:"puppy_care",choice:"porch"}]};
  assert.throws(()=>replayWednesday(bad as typeof w),/not currently due/);
});
