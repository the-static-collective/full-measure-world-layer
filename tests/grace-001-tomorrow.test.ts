import test from "node:test";
import assert from "node:assert/strict";
import {appendEvent, emptySession, replaySession} from "../specimens/grace-001/session.ts";
import {createDayReceipt} from "../specimens/grace-001/dayReceipt.ts";
import {
  startWednesday,
  replayWednesday,
  availableWednesdayActions,
  playWednesdayAction,
  deriveWednesdayScene,
  type WednesdayCampaign,
} from "../specimens/grace-001/tomorrow.ts";

function tuesdayWith(actionId: "feed-home" | "share-meal") {
  let day = emptySession();
  day = appendEvent(day, {type:"economy_action",actionId});
  for (let n=0;n<3;n++) day=appendEvent(day,{type:"economy_action",actionId:"prayer-block"});
  assert.equal(replaySession(day).culture.stocks.time,0);
  return day;
}

test("Wednesday starts only after Tuesday runs out of time, without changing Tuesday",()=>{
  const incomplete=emptySession();
  assert.throws(()=>startWednesday(incomplete),/Tuesday must reach zero time/);
  const tuesday=tuesdayWith("feed-home");
  const source=JSON.stringify(tuesday);
  const next=startWednesday(tuesday);
  assert.equal(JSON.stringify(tuesday),source);
  assert.equal(next.sourceDayReceipt.replayChecksum,createDayReceipt(tuesday).replayChecksum);
  const carried=replayWednesday(next);
  assert.deepEqual(carried.stocks,{...replaySession(tuesday).culture.stocks,time:4});
  assert.ok(carried.openNeeds.some(d=>d.id==="client-callback"));
  assert.ok(carried.openNeeds.some(d=>d.id==="wednesday-dinner"));
  assert.ok(!carried.openNeeds.some(d=>d.id==="home-dinner"&&d.label==="Dinner at home tonight"));
});

test("same end stocks with different Tuesday histories reveal different Wednesday actions",()=>{
  const fed=tuesdayWith("feed-home");
  const shared=tuesdayWith("share-meal");
  assert.deepEqual(replaySession(fed).culture.stocks,replaySession(shared).culture.stocks);
  const fedMoves=availableWednesdayActions(startWednesday(fed)).map(x=>x.id);
  const sharedMoves=availableWednesdayActions(startWednesday(shared)).map(x=>x.id);
  assert.ok(!fedMoves.includes("shared-table-invitation"));
  assert.ok(sharedMoves.includes("shared-table-invitation"));
});

test("a Wednesday invitation is an offer, not acceptance or extra food",()=>{
  const campaign=startWednesday(tuesdayWith("share-meal"));
  const before=replayWednesday(campaign);
  const next=playWednesdayAction(campaign,"shared-table-invitation");
  const after=replayWednesday(next);
  assert.equal(after.stocks.food,before.stocks.food);
  assert.equal(after.sharedTable,"offered");
  assert.ok(after.receipts.at(-1)?.nonClaims.includes("invitation offered != acceptance or fulfillment"));
  assert.equal(next.events.length,1);
});

test("Wednesday meal spends carried food, not freshly minted supply",()=>{
  let day=emptySession();
  day=appendEvent(day,{type:"economy_action",actionId:"grocery-run"});
  day=appendEvent(day,{type:"economy_action",actionId:"rest-block"});
  const next=startWednesday(day);
  const before=replayWednesday(next);
  const after=replayWednesday(playWednesdayAction(next,"make-wednesday-dinner"));
  assert.equal(after.stocks.food,before.stocks.food-1);
  assert.equal(after.stocks.time,before.stocks.time-1);
  assert.equal(after.openNeeds.find(d=>d.id==="wednesday-dinner")?.remaining,0);
  assert.ok(after.openNeeds.some(d=>d.id==="client-callback"));
});

test("optional porch mystery requires a prior visit plus reflection on that exact visit",()=>{
  let day=emptySession();
  day=appendEvent(day,{type:"economy_action",actionId:"storyship-block"});
  day=appendEvent(day,{type:"archaeology_visit",sceneId:"door-learns-morning",choiceId:"open-the-door"});
  day=appendEvent(day,{type:"economy_action",actionId:"reflection-block"});
  day=appendEvent(day,{type:"flashback_reflection",sourceEventId:"grace-event-0002",presentReflection:"I noticed the ordinary door after I returned."});
  day=appendEvent(day,{type:"economy_action",actionId:"rest-block"});
  const campaign=startWednesday(day);
  assert.ok(availableWednesdayActions(campaign).some(x=>x.id==="porch-relation"));
  assert.throws(()=>playWednesdayAction(campaign,"porch-relation"),/player expression/);
  const next=playWednesdayAction(campaign,"porch-relation","The opened door and the remembered return belong to one playable relation.");
  const replay=replayWednesday(next);
  assert.equal(replay.porchDoor?.status,"opened-in-fiction");
  assert.deepEqual(replay.porchDoor?.sourceTuesdayEventIds,["grace-event-0002","grace-event-0004"]);
  assert.ok(replay.receipts.at(-1)?.nonClaims.includes("fictional door opening != external-world occurrence"));
  assert.equal(JSON.stringify(next.sourceDayReceipt.session),JSON.stringify(day));
});

test("cannot inject Wednesday action or edit Tuesday provenance by importing a counterfeit record",()=>{
  const campaign=startWednesday(tuesdayWith("feed-home"));
  const fake={...campaign,events:[{id:"wed-event-0001",type:"action",actionId:"porch-relation",relationText:"made up"}]} as WednesdayCampaign;
  assert.throws(()=>replayWednesday(fake),/not available/);
  const tampered=structuredClone(campaign);
  tampered.sourceDayReceipt.session.events[0]={id:"grace-event-0001",type:"economy_action",actionId:"share-meal"};
  assert.throws(()=>replayWednesday(tampered),/Tuesday source receipt mismatch/);
  const silentChange=structuredClone(campaign);
  silentChange.sourceDayReceipt.session.events[0].id="silently-renamed-event";
  assert.throws(()=>replayWednesday(silentChange),/Tuesday source receipt mismatch/);
});

test("Wednesday has its own finite hand and an end scene that keeps unmet needs",()=>{
  let day=emptySession();
  day=appendEvent(day,{type:"economy_action",actionId:"grocery-run"});
  day=appendEvent(day,{type:"economy_action",actionId:"rest-block"});
  let campaign=startWednesday(day);
  assert.ok(availableWednesdayActions(campaign).length<=4);
  for(let n=0;n<4;n++) campaign=playWednesdayAction(campaign,"pray-wednesday");
  const scene=deriveWednesdayScene(campaign);
  assert.equal(scene.title,"Wednesday takes attendance");
  assert.ok(scene.openNeeds.some(d=>d.id==="client-callback"));
  assert.deepEqual(availableWednesdayActions(campaign),[]);
});
