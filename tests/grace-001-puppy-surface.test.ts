import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {appendEvent,emptySession} from "../specimens/grace-001/session.ts";
import {GraceTomorrowSurface} from "../src/components/GraceTomorrowSurface.tsx";
import {
  startWednesday,playWednesdayAction,offerPuppyCare,respondToPuppyCare,
} from "../specimens/grace-001/tomorrow.ts";

function wednesday() {
  let day=emptySession();
  day=appendEvent(day,{type:"economy_action",actionId:"grocery-run"});
  day=appendEvent(day,{type:"economy_action",actionId:"rest-block"});
  return startWednesday(day);
}
const view=(campaign:ReturnType<typeof wednesday>)=>renderToStaticMarkup(
  React.createElement(GraceTomorrowSurface,{
    campaign,onChange:()=>{},onExportTuesday:()=>{},
  }),
);
test("puppy wild card arrives in focused play with an explicit option to decline",()=>{
  const session=playWednesdayAction(wednesday(),"pray-wednesday");
  const html=view(session);
  assert.match(html,/Living wild card/);
  assert.match(html,/puppy appears at the screen door/);
  assert.match(html,/Offer temporary care/);
  assert.match(html,/Not today/);
  assert.doesNotMatch(html,/What can you carry now/);
});
test("once puppy care is due, it interrupts the ordinary hand even when no time remains",()=>{
  let session=playWednesdayAction(wednesday(),"rest-wednesday");
  session=offerPuppyCare(session,"temporary-care");
  session=playWednesdayAction(session,"rest-wednesday");
  const html=view(session);
  assert.match(html,/The puppy has other plans/);
  assert.match(html,/Go outside together/);
  assert.doesNotMatch(html,/What can you carry now/);
  assert.doesNotMatch(html,/Wednesday takes attendance/);
});
test("after the care receipt, puppy need is settled and any time debt stays visible",()=>{
  let session=playWednesdayAction(wednesday(),"rest-wednesday");
  session=offerPuppyCare(session,"temporary-care");
  session=playWednesdayAction(session,"rest-wednesday");
  session=respondToPuppyCare(session,"porch");
  const html=view(session);
  assert.match(html,/future time block owed/);
  assert.match(html,/Wednesday takes attendance/);
  assert.doesNotMatch(html,/The puppy has other plans/);
});
