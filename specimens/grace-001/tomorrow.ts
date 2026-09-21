import {createDayReceipt, verifyDayReceipt, type GraceDayReceipt} from "./dayReceipt.ts";
import {replaySession, type GraceSession} from "./session.ts";
import type {Stocks, CultureTrace} from "./culture.ts";

export type WednesdayActionId =
  | "housing-follow-up" | "make-wednesday-dinner" | "shared-table-invitation"
  | "porch-relation" | "check-vehicle" | "pray-wednesday" | "rest-wednesday";

export type PuppyArrivalChoice = "temporary-care" | "decline";
export type PuppyCareChoice = "porch" | "dog-park";
export type WednesdayEvent =
  | {id:string;type:"action";actionId:WednesdayActionId;relationText?:string}
  | {id:string;type:"puppy_arrival";choice:PuppyArrivalChoice}
  | {id:string;type:"puppy_care";choice:PuppyCareChoice};
export interface PuppyState {
  status:"not_met" | "declined" | "visiting";
  care:"not_due" | "due" | "settled";
  kitMeals:number;
  timeDebt:number;
}
export interface PuppyOffer {
  id:"puppy-at-the-door" | "puppy-needs-outside";
  title:string;
  body:string;
  options:{id:string;label:string;note:string}[];
  nonClaims:string[];
}
export interface WednesdayCampaign {
  schema: "full-measure.grace-wednesday.v1";
  sourceDayReceipt: GraceDayReceipt;
  sealedTuesdayEventLog: string;
  events: WednesdayEvent[];
}
export interface OpenNeed {
  id: string;
  label: string;
  remaining: number;
  required: boolean;
}
export interface WednesdayReceipt {
  id: string;
  actionId: WednesdayActionId | "puppy-arrival" | "puppy-care";
  claims: string[];
  nonClaims: string[];
  sourceTuesdayEventIds: string[];
}
export interface WednesdayReplay {
  stocks: Stocks;
  openNeeds: OpenNeed[];
  cultureTraces: Record<CultureTrace, number>;
  sharedTable: "none" | "offered";
  housingFollowUp: "none" | "attempted";
  puppy:PuppyState;
  porchDoor: null | {
    status: "opened-in-fiction";
    sourceTuesdayEventIds: string[];
    playerExpression: string;
  };
  receipts: WednesdayReceipt[];
}
export interface WednesdayAction {
  id: WednesdayActionId;
  label: string;
  cost: Partial<Stocks>;
  produces?: Partial<Stocks>;
  note: string;
}
export interface WednesdayScene {
  eyebrow: string;
  title: string;
  body: string;
  openNeeds: OpenNeed[];
  stocks: Stocks;
  latestReceipt: WednesdayReceipt | null;
}

const actions: Record<WednesdayActionId, WednesdayAction> = {
  "housing-follow-up": {
    id:"housing-follow-up",label:"Follow up on the housing window",
    cost:{time:1,attention:1},
    note:"Make one new attempt. Neither an attempted call nor an offered appointment secures housing.",
  },
  "make-wednesday-dinner": {
    id:"make-wednesday-dinner",label:"Make tonight's dinner",
    cost:{time:1,food:1},note:"Use food actually carried from Tuesday; no free groceries appear overnight.",
  },
  "shared-table-invitation": {
    id:"shared-table-invitation",label:"Offer a place at the shared table",
    cost:{time:1,attention:1},
    note:"Tuesday's shared meal makes an invitation possible. Offer != acceptance != food created.",
  },
  "porch-relation": {
    id:"porch-relation",label:"Return to the porch with both receipts",
    cost:{time:1,attention:1},
    note:"An optional fictional puzzle: express a relation from the prior visit and flashback.",
  },
  "check-vehicle": {
    id:"check-vehicle",label:"Investigate the vehicle noise",
    cost:{time:2,cash:8,transport:1,attention:1},
    note:"Spend the remaining trip and money; investigation is not proof the vehicle is repaired.",
  },
  "pray-wednesday": {
    id:"pray-wednesday",label:"Take a prayer block",
    cost:{time:1},produces:{attention:1},
    note:"Use real time to restore attention. No external need is solved by implication.",
  },
  "rest-wednesday": {
    id:"rest-wednesday",label:"Take a rest block",
    cost:{time:2},produces:{attention:2},
    note:"Spend two time blocks to recover attention; other demands continue.",
  },
};
const order: WednesdayActionId[] = [
  "porch-relation","housing-follow-up","shared-table-invitation",
  "make-wednesday-dinner","check-vehicle","pray-wednesday","rest-wednesday",
];
const copy = <T,>(value:T):T => structuredClone(value);
function source(campaign:WednesdayCampaign) {
  if(campaign.schema!=="full-measure.grace-wednesday.v1")
    throw new Error("Unsupported Wednesday campaign schema");
  if(!verifyDayReceipt(campaign.sourceDayReceipt).ok ||
      JSON.stringify(campaign.sourceDayReceipt.session.events)!==campaign.sealedTuesdayEventLog)
    throw new Error("Tuesday source receipt mismatch");
  const tuesday=replaySession(campaign.sourceDayReceipt.session);
  if(tuesday.culture.stocks.time!==0)
    throw new Error("Tuesday must reach zero time before Wednesday starts");
  return tuesday;
}
function porchSources(campaign:WednesdayCampaign): string[] {
  const tuesday=source(campaign);
  for(const visit of tuesday.archaeology.visits) {
    if(visit.sceneId!=="door-learns-morning" || visit.choiceId!=="open-the-door") continue;
    const visitEvent=campaign.sourceDayReceipt.session.events.find(
      event=>event.type==="archaeology_visit" &&
        event.sceneId==="door-learns-morning" && event.choiceId==="open-the-door",
    );
    const reflection=tuesday.apertures.flashbacks.find(
      item=>item.sourceEventId===visitEvent?.id,
    );
    if(!visitEvent || !reflection) continue;
    const reflectEvent=campaign.sourceDayReceipt.session.events.find(
      event=>event.type==="flashback_reflection" &&
        event.sourceEventId===visitEvent.id &&
        event.presentReflection===reflection.presentReflection,
    );
    if(reflectEvent) return [visitEvent.id,reflectEvent.id];
  }
  return [];
}
function canAfford(stocks:Stocks,cost:Partial<Stocks>) {
  return Object.entries(cost).every(([name,amount])=>
    stocks[name as keyof Stocks]>=amount);
}
function eligible(campaign:WednesdayCampaign,state:WednesdayReplay,id:WednesdayActionId):boolean {
  if(state.stocks.time===0 || !canAfford(state.stocks,actions[id].cost)) return false;
  if(id==="porch-relation") return state.porchDoor===null && porchSources(campaign).length===2;
  if(id==="shared-table-invitation") return state.sharedTable==="none" &&
    source(campaign).culture.history.some(receipt=>receipt.actionId==="share-meal");
  if(id==="housing-follow-up") return state.housingFollowUp==="none" &&
    source(campaign).story.external.clientHousing!=="open";
  if(id==="make-wednesday-dinner") return state.openNeeds.some(
    d=>d.id==="wednesday-dinner" && d.remaining>0);
  if(id==="check-vehicle") return state.openNeeds.some(
    d=>d.id==="vehicle-check" && d.remaining>0);
  return true;
}
function initialState(campaign:WednesdayCampaign):WednesdayReplay {
  const tuesday=source(campaign);
  const carry=tuesday.culture.demands
    .filter(d=>d.amount>d.met)
    .map(d=>({id:d.id,label:`Tuesday — ${d.label} (carried)`,
      remaining:d.amount-d.met,required:d.required}));
  if(tuesday.story.external.clientHousing!=="open")
    carry.push({id:"housing-continuity",label:"Housing remains unresolved (carried)",
      remaining:1,required:true});
  return {
    stocks:{...copy(tuesday.culture.stocks),time:4},
    openNeeds:[...carry,{id:"wednesday-dinner",label:"Wednesday dinner",
      remaining:1,required:true}],
    cultureTraces:copy(tuesday.culture.traces),
    sharedTable:"none",housingFollowUp:"none",porchDoor:null,
    puppy:{status:"not_met",care:"not_due",kitMeals:0,timeDebt:0},receipts:[],
  };
}
export function startWednesday(tuesday:GraceSession):WednesdayCampaign {
  const replay=replaySession(tuesday);
  if(replay.culture.stocks.time!==0)
    throw new Error("Tuesday must reach zero time before Wednesday starts");
  const campaign:WednesdayCampaign={
    schema:"full-measure.grace-wednesday.v1",
    sourceDayReceipt:createDayReceipt(tuesday),
    sealedTuesdayEventLog:JSON.stringify(tuesday.events),events:[],
  };
  replayWednesday(campaign);
  return campaign;
}
export function replayWednesday(campaign:WednesdayCampaign):WednesdayReplay {
  const next=initialState(campaign);
  for(let i=0;i<campaign.events.length;i++) {
    const event=campaign.events[i];
    if(event.id!==`wed-event-${String(i+1).padStart(4,"0")}` ||
      !["action","puppy_arrival","puppy_care"].includes(event.type))
      throw new Error("Invalid Wednesday event identity or type");
    if(event.type==="puppy_arrival") {
      if(next.puppy.status!=="not_met" ||
        !campaign.events.slice(0,i).some(item=>item.type==="action") ||
        next.stocks.time<=0)
        throw new Error("puppy arrival is not currently available");
      next.puppy.status=event.choice==="temporary-care"?"visiting":"declined";
      if(next.puppy.status==="visiting") next.puppy.kitMeals=1;
      if(!["temporary-care","decline"].includes(event.choice))
        throw new Error("unknown puppy arrival choice");
      next.receipts.push({
        id:event.id,actionId:"puppy-arrival",sourceTuesdayEventIds:[],
        claims:event.choice==="temporary-care"?
          ["Grace accepted temporary puppy care with a supplied leash and one puppy-specific meal"]:
          ["Grace declined the request for temporary puppy care"],
        nonClaims:["temporary care != permanent ownership",
          "a puppy is not a worker unit or an automatic morale bonus",
          "puppy-specific meal != human food"],
      });
      continue;
    }
    if(event.type==="puppy_care") {
      if(next.puppy.status!=="visiting" || next.puppy.care!=="due")
        throw new Error("puppy care is not currently due");
      if(!["porch","dog-park"].includes(event.choice))
        throw new Error("unknown puppy care choice");
      if(next.puppy.kitMeals<1) throw new Error("no declared puppy meal in the supplied kit");
      if(event.choice==="dog-park") {
        if(next.stocks.transport<1) throw new Error("dog park requires an available transport unit");
        next.stocks.transport-=1;
      }
      if(next.stocks.time>=1) next.stocks.time-=1;
      else next.puppy.timeDebt+=1;
      next.puppy.kitMeals-=1;
      next.puppy.care="settled";
      next.receipts.push({
        id:event.id,actionId:"puppy-care",sourceTuesdayEventIds:[],
        claims:event.choice==="porch"?
          ["the puppy was taken outside to the porch and given its supplied meal"]:
          ["the puppy was taken to the dog park and given its supplied meal",
           "a possible dog-park conversation was noticed, not established"],
        nonClaims:["care receipt != puppy consent, ownership, or guaranteed affection",
          "puppy meal did not subtract from or create human food",
          "next-day time debt != free time or a completed future-day action"],
      });
      continue;
    }
    if(next.puppy.status==="visiting" && next.puppy.care==="due")
      throw new Error("puppy care response required before another ordinary action");
    const hand=order.filter(id=>eligible(campaign,next,id)).slice(0,4);
    if(!hand.includes(event.actionId))
      throw new Error(`Wednesday action not available: ${event.actionId}`);
    if(event.actionId==="porch-relation" &&
        (!event.relationText || event.relationText.trim().length<8))
      throw new Error("porch relation requires a player expression");
    const action=actions[event.actionId];
    for(const [key,amount] of Object.entries(action.cost))
      next.stocks[key as keyof Stocks]-=amount;
    for(const [key,amount] of Object.entries(action.produces??{}))
      next.stocks[key as keyof Stocks]+=amount;

    const claims:string[]=[`Wednesday action: ${action.label}`];
    const nonClaims:string[]=["Wednesday act does not rewrite Tuesday history"];
    const sourceTuesdayEventIds:string[]=[];
    switch(event.actionId) {
      case "make-wednesday-dinner": {
        const dinner=next.openNeeds.find(d=>d.id==="wednesday-dinner");
        if(dinner) dinner.remaining=0;
        claims.push("Wednesday dinner was made with carried food");
        nonClaims.push("Wednesday dinner does not retroactively complete Tuesday dinner");
        break;
      }
      case "housing-follow-up":
        next.housingFollowUp="attempted";
        claims.push("housing follow-up attempted");
        nonClaims.push("follow-up attempt != secured housing");
        break;
      case "shared-table-invitation":
        next.sharedTable="offered";
        claims.push("a shared-table invitation was offered");
        nonClaims.push("invitation offered != acceptance or fulfillment");
        break;
      case "porch-relation":
        sourceTuesdayEventIds.push(...porchSources(campaign));
        next.porchDoor={status:"opened-in-fiction",sourceTuesdayEventIds,
          playerExpression:event.relationText!.trim()};
        claims.push("the local fictional porch archive became reachable through two distinct earlier receipts");
        nonClaims.push("fictional door opening != external-world occurrence",
          "player expression != proof of one correct symbolic interpretation");
        break;
      case "check-vehicle": {
        const vehicle=next.openNeeds.find(d=>d.id==="vehicle-check");
        if(vehicle) vehicle.remaining=0;
        claims.push("vehicle noise was investigated");
        nonClaims.push("investigation != vehicle repaired");
        break;
      }
      case "pray-wednesday":
        next.cultureTraces.prayer+=1;
        nonClaims.push("prayer != guaranteed external result");
        break;
      case "rest-wednesday":
        next.cultureTraces.rest+=1;
        nonClaims.push("rest != completed external need");
        break;
    }
    next.receipts.push({
      id:event.id,actionId:event.actionId,claims,nonClaims,sourceTuesdayEventIds,
    });
    if(next.puppy.status==="visiting" && next.puppy.care==="not_due")
      next.puppy.care="due";
  }
  return next;
}
export function availableWednesdayActions(campaign:WednesdayCampaign):WednesdayAction[] {
  const state=replayWednesday(campaign);
  if(state.puppy.status==="visiting" && state.puppy.care==="due") return [];
  return order.filter(id=>eligible(campaign,state,id)).slice(0,4).map(id=>copy(actions[id]));
}
export function derivePuppyArrivalOffer(campaign:WednesdayCampaign):PuppyOffer|null {
  const state=replayWednesday(campaign);
  if(state.puppy.status!=="not_met" || state.stocks.time<=0 ||
    !campaign.events.some(event=>event.type==="action")) return null;
  return {
    id:"puppy-at-the-door",title:"A puppy appears at the screen door",
    body:"A neighbor asks if Grace can provide temporary care. They bring a leash and one puppy-specific meal. Taking the puppy in is a choice, not a quest requirement.",
    options:[
      {id:"temporary-care",label:"Offer temporary care",note:"Accept a real dependent with needs and unpredictable timing."},
      {id:"decline",label:"Not today",note:"Grace does not take responsibility for an animal she cannot care for today."},
    ],
    nonClaims:["arrival offer != compelled adoption","temporary care != permanent ownership"],
  };
}
export function derivePuppyInterrupt(campaign:WednesdayCampaign):PuppyOffer|null {
  const state=replayWednesday(campaign);
  if(state.puppy.status!=="visiting" || state.puppy.care!=="due") return null;
  return {
    id:"puppy-needs-outside",title:"The puppy has other plans",
    body:"A leash scrapes the floor. The puppy needs to go outside and have its supplied meal. Tuesday's plans do not get priority over a living creature's immediate care.",
    options:[
      {id:"porch",label:"Go outside together",note:"Costs one Wednesday time block, or records one block of next-day time debt if the day is already full."},
      ...(state.stocks.transport>=1?
        [{id:"dog-park",label:"Take the puppy to the dog park",note:"Costs one time block and one real transport use. A possible social encounter is only a candidate."}]:[]),
    ],
    nonClaims:["wild card != permission to neglect an animal","puppy care != guaranteed affection"],
  };
}
export function offerPuppyCare(
  campaign:WednesdayCampaign,choice:PuppyArrivalChoice,
):WednesdayCampaign {
  if(!derivePuppyArrivalOffer(campaign)) throw new Error("puppy arrival is not currently available");
  const next={...campaign,events:[...campaign.events,{
    id:`wed-event-${String(campaign.events.length+1).padStart(4,"0")}`,
    type:"puppy_arrival" as const,choice,
  }]};
  replayWednesday(next);
  return next;
}
export function respondToPuppyCare(
  campaign:WednesdayCampaign,choice:PuppyCareChoice,
):WednesdayCampaign {
  const offer=derivePuppyInterrupt(campaign);
  if(!offer) throw new Error("puppy care is not currently due");
  if(!offer.options.some(option=>option.id===choice))
    throw new Error("puppy care choice is not currently available");
  const next={...campaign,events:[...campaign.events,{
    id:`wed-event-${String(campaign.events.length+1).padStart(4,"0")}`,
    type:"puppy_care" as const,choice,
  }]};
  replayWednesday(next);
  return next;
}
export function playWednesdayAction(
  campaign:WednesdayCampaign,actionId:WednesdayActionId,relationText?:string,
):WednesdayCampaign {
  if(derivePuppyInterrupt(campaign))
    throw new Error("puppy care response required before another ordinary action");
  if(!availableWednesdayActions(campaign).some(action=>action.id===actionId))
    throw new Error(`Wednesday action not available: ${actionId}`);
  if(actionId==="porch-relation" && (!relationText || relationText.trim().length<8))
    throw new Error("porch relation requires a player expression");
  const next:WednesdayCampaign={
    ...campaign,
    events:[...campaign.events,{
      id:`wed-event-${String(campaign.events.length+1).padStart(4,"0")}`,
      type:"action",actionId,
      ...(actionId==="porch-relation"?{relationText:relationText!.trim()}:{}),
    }],
  };
  replayWednesday(next);
  return next;
}
export function deriveWednesdayScene(campaign:WednesdayCampaign):WednesdayScene {
  const state=replayWednesday(campaign);
  if(state.stocks.time===0) return {
    eyebrow:"Wednesday · night",title:"Wednesday takes attendance",
    body:"The second day ends with its own receipts. Yesterday remains unchanged; open needs travel onward.",
    openNeeds:state.openNeeds.filter(d=>d.remaining>0),stocks:state.stocks,
    latestReceipt:state.receipts.at(-1)??null,
  };
  const tuesday=source(campaign);
  const withInvitation=tuesday.culture.history.some(r=>r.actionId==="share-meal");
  return {
    eyebrow:"Wednesday · the world remembers",
    title:state.puppy.status==="visiting"?
      (state.puppy.care==="settled"?"The puppy settles near the table":"There are paws in the hallway"):
      state.porchDoor?"The porch archive is open":withInvitation?
      "Someone remembers Tuesday's table":"Yesterday left something on the table",
    body:state.puppy.status==="visiting"?
      (state.puppy.care==="settled"?
        "Outside time and the supplied puppy meal were real work. The puppy's future care and handoff remain the party's responsibility, not a bonus.":
        "A living guest has its own schedule. The next care need cannot be optimized away."):
      state.porchDoor?
      "Two distinct receipts made a local fictional archive reachable. No outside-world fact was changed.":
      withInvitation?
      "Tuesday's shared meal makes a new invitation possible. Another person's response remains their own.":
      "Food, cash, transport, unfinished work, and earlier choices have all crossed into a new day. Nothing was reset for convenience.",
    openNeeds:state.openNeeds.filter(d=>d.remaining>0),stocks:state.stocks,
    latestReceipt:state.receipts.at(-1)??null,
  };
}
