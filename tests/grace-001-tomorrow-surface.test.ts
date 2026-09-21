import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {GracePlaySurface} from "../src/components/GracePlaySurface.tsx";
import {GraceTomorrowSurface} from "../src/components/GraceTomorrowSurface.tsx";
import {appendEvent,emptySession} from "../specimens/grace-001/session.ts";
import {startWednesday,playWednesdayAction} from "../specimens/grace-001/tomorrow.ts";

function sealedTuesday() {
  let day=emptySession();
  day=appendEvent(day,{type:"economy_action",actionId:"grocery-run"});
  day=appendEvent(day,{type:"economy_action",actionId:"rest-block"});
  day=appendEvent(day,{type:"dream_red_door"});
  return day;
}

test("Tuesday attendance offers an explicit Wednesday transition",()=>{
  const html=renderToStaticMarkup(React.createElement(GracePlaySurface,{
    session:sealedTuesday(),commit:()=>{},onBeginWednesday:()=>{},
  }));
  assert.match(html,/THE HOUSE TAKES ATTENDANCE/);
  assert.match(html,/Begin Wednesday/);
});

test("Wednesday opens with a compact hand and carried supply rather than a Tuesday reset",()=>{
  const campaign=startWednesday(sealedTuesday());
  const html=renderToStaticMarkup(React.createElement(GraceTomorrowSurface,{
    campaign,onChange:()=>{},onExportTuesday:()=>{},
  }));
  assert.match(html,/Wednesday/);
  assert.match(html,/Make tonight&#x27;s dinner|Make tonight's dinner/);
  assert.match(html,/Review Tuesday/);
  assert.match(html,/Housing-resource callback/);
  assert.doesNotMatch(html,/Return the housing call/);
});

test("Wednesday attendance shows residuals when its time is exhausted",()=>{
  let campaign=startWednesday(sealedTuesday());
  for(let i=0;i<4;i++) campaign=playWednesdayAction(campaign,"pray-wednesday");
  const html=renderToStaticMarkup(React.createElement(GraceTomorrowSurface,{
    campaign,onChange:()=>{},onExportTuesday:()=>{},
  }));
  assert.match(html,/Wednesday takes attendance/);
  assert.match(html,/Housing-resource callback/);
  assert.doesNotMatch(html,/What can you carry now/);
});
