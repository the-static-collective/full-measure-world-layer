import React, {useMemo, useState} from "react";
import {
  availableWednesdayActions,
  deriveWednesdayScene,
  derivePuppyArrivalOffer,
  derivePuppyInterrupt,
  offerPuppyCare,
  respondToPuppyCare,
  playWednesdayAction,
  replayWednesday,
  type PuppyArrivalChoice,
  type PuppyCareChoice,
  type WednesdayActionId,
  type WednesdayCampaign,
} from "../../specimens/grace-001/tomorrow.ts";

interface Props {
  campaign: WednesdayCampaign;
  onChange: (next: WednesdayCampaign) => void;
  onExportTuesday: () => void;
}
function costText(cost:Record<string,number|undefined>):string {
  return Object.entries(cost).filter(([,n])=>typeof n==="number"&&n>0)
    .map(([key,n])=>key==="cash"?`$${n}`:`${n} ${key}`).join(" · ");
}

export function GraceTomorrowSurface({campaign,onChange,onExportTuesday}:Props) {
  const [selected,setSelected]=useState<WednesdayActionId|null>(null);
  const [expression,setExpression]=useState("");
  const [beat,setBeat]=useState<{title:string;lines:string[]}|null>(null);
  const [error,setError]=useState<string|null>(null);
  const current=useMemo(()=>replayWednesday(campaign),[campaign]);
  const scene=useMemo(()=>deriveWednesdayScene(campaign),[campaign]);
  const actions=useMemo(()=>availableWednesdayActions(campaign),[campaign]);
  const puppyArrival=useMemo(()=>derivePuppyArrivalOffer(campaign),[campaign]);
  const puppyInterrupt=useMemo(()=>derivePuppyInterrupt(campaign),[campaign]);
  const puppyOffer=puppyInterrupt??puppyArrival;
  const picked=actions.find(action=>action.id===selected)??null;

  const perform=(id:WednesdayActionId)=>{
    try {
      const next=playWednesdayAction(campaign,id,
        id==="porch-relation"?expression:undefined);
      const receipt=replayWednesday(next).receipts.at(-1);
      onChange(next);
      setSelected(null);
      setExpression("");
      setError(null);
      if(receipt) setBeat({
        title:next.events.at(-1)?.actionId==="porch-relation"?"A new door in the fiction":"Wednesday answered",
        lines:[...receipt.claims,...receipt.nonClaims],
      });
    }catch(err){setError(err instanceof Error?err.message:String(err));}
  };

  const respondToPuppy=(choice:string)=>{
    try {
      const next=puppyInterrupt
        ? respondToPuppyCare(campaign,choice as PuppyCareChoice)
        : offerPuppyCare(campaign,choice as PuppyArrivalChoice);
      const receipt=replayWednesday(next).receipts.at(-1);
      onChange(next);
      setSelected(null);
      setError(null);
      setBeat(receipt?{
        title:puppyInterrupt?"The puppy's plans matter too":"A new set of paws enters the story",
        lines:[...receipt.claims,...receipt.nonClaims],
      }:null);
    }catch(err){setError(err instanceof Error?err.message:String(err));}
  };

  return (
    <div className="min-h-[30rem] bg-gradient-to-b from-sky-50 via-amber-50 to-stone-50 px-4 py-7 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-900">{scene.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">{scene.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">{scene.body}</p>
        <p className="mt-3 text-xs text-stone-500">Tuesday is sealed. Wednesday carries its receipts and residuals, not a fresh starting inventory.</p>
        <div className="mt-5 grid grid-cols-5 gap-1.5" aria-label="Carried supply">
          {(["time","cash","food","transport","attention"] as const).map(key=>(
            <div key={key} className="rounded-xl bg-stone-950 px-1 py-2.5 text-center text-white">
              <span className="block text-base font-bold">{key==="cash"?"$":""}{current.stocks[key]}</span>
              <span className="mt-0.5 block text-[9px] uppercase text-stone-400">{key}</span>
            </div>
          ))}
        </div>
        {current.puppy.status==="visiting" && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-900">Puppy in the party · temporary care</p>
            <p className="mt-1 text-sm text-stone-800">
              {current.puppy.care==="settled"?
                "The puppy has been cared for. A real handoff or future care still needs arranging.":
                current.puppy.care==="due"?
                "The puppy needs outside time now; other ordinary choices are held.":
                "A new dependent has its own schedule."}
            </p>
            {current.puppy.timeDebt>0 && (
              <p className="mt-2 text-xs font-semibold text-orange-900">
                {current.puppy.timeDebt} future time block owed for urgent care given beyond today's available time.
              </p>
            )}
          </div>
        )}
        {!beat && puppyOffer && (
          <section className="mt-5 rounded-2xl border-2 border-violet-400 bg-violet-950 p-5 text-white" aria-label="Puppy wild card">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">Living wild card · puppy</p>
            <h3 className="mt-2 text-2xl font-semibold">{puppyOffer.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-violet-100">{puppyOffer.body}</p>
            <div className="mt-5 grid gap-2">
              {puppyOffer.options.map(option=>(
                <button type="button" key={option.id}
                  onClick={()=>respondToPuppy(option.id)}
                  className="min-h-14 rounded-xl border border-white/20 bg-white/10 p-3 text-left hover:bg-white/20">
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-1 block text-xs text-violet-200">{option.note}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-violet-300">{puppyOffer.nonClaims.join(" · ")}</p>
          </section>
        )}
        {beat && (
          <section aria-live="polite" className="mt-5 rounded-2xl border border-cyan-200 bg-slate-950 p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Consequence receipt</p>
            <h3 className="mt-2 text-xl font-semibold">{beat.title}</h3>
            <div className="mt-3 space-y-2 text-sm text-stone-200">{beat.lines.map((line,i)=><p key={i}>{line}</p>)}</div>
            <button type="button" onClick={()=>setBeat(null)}
              className="mt-5 min-h-11 rounded-xl bg-cyan-200 px-4 py-2 text-sm font-semibold text-slate-950">Continue Wednesday</button>
          </section>
        )}
        {!beat && !puppyOffer && actions.length>0 && (
          <>
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-stone-500">What can you carry now?</p>
            <div className="mt-2 grid gap-2">
              {actions.map(action=>(
                <button key={action.id} type="button" aria-expanded={selected===action.id}
                  onClick={()=>{setSelected(selected===action.id?null:action.id);setError(null);}}
                  className={selected===action.id?
                    "rounded-2xl border-2 border-amber-500 bg-white px-4 py-3 text-left shadow-md":
                    "rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm hover:border-amber-400"}>
                  <span className="block text-sm font-semibold text-stone-950">{action.label}</span>
                  <span className="mt-1 block text-xs text-stone-600">{costText(action.cost)}</span>
                </button>
              ))}
            </div>
            {picked && (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-amber-800">Before you commit</p>
                <p className="mt-2 text-sm text-stone-700">{picked.note}</p>
                <p className="mt-2 text-xs text-stone-600">Spend: {costText(picked.cost)}. This uses Wednesday supply only.</p>
                {picked.id==="porch-relation" && (
                  <label className="mt-3 block text-sm text-stone-900">
                    Express the connection you noticed
                    <textarea value={expression} onChange={e=>setExpression(e.target.value)}
                      placeholder="What relation can the two earlier receipts support inside this story?"
                      className="mt-2 min-h-24 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm" />
                  </label>
                )}
                <button type="button" onClick={()=>perform(picked.id)}
                  disabled={picked.id==="porch-relation" && expression.trim().length<8}
                  className="mt-4 min-h-11 w-full rounded-xl bg-stone-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                  Do it
                </button>
              </div>
            )}
          </>
        )}
        {!beat && !puppyOffer && current.stocks.time===0 && (
          <section className="mt-5 rounded-2xl bg-stone-950 p-5 text-stone-100">
            <h3 className="text-xl font-semibold">Wednesday takes attendance</h3>
            <p className="mt-2 text-xs text-stone-400">Open needs remain open; this is not a verdict.</p>
          </section>
        )}
        <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Still open</p>
          <div className="mt-2 space-y-1.5 text-sm text-stone-700">
            {scene.openNeeds.map(need=><p key={need.id}>{need.label} · {need.remaining} remaining</p>)}
          </div>
          {current.porchDoor && <p className="mt-3 text-xs text-violet-800">
            Fictional porch archive: open · witnessed by {current.porchDoor.sourceTuesdayEventIds.join(" + ")}.
          </p>}
        </section>
        <details className="mt-4 rounded-xl border border-stone-200 bg-white p-3">
          <summary className="cursor-pointer text-xs font-semibold text-stone-700">Review Tuesday's sealed history</summary>
          <p className="mt-3 text-xs text-stone-600">
            {campaign.sourceDayReceipt.summary.events} Tuesday events · {campaign.sourceDayReceipt.summary.unresolvedDemand} unresolved demand units at day close.
          </p>
          <button type="button" onClick={onExportTuesday} className="mt-3 rounded-full border border-stone-300 px-3 py-2 text-xs font-medium">
            Export Tuesday Day Receipt
          </button>
          <p className="mt-2 text-xs text-stone-500">
            History and artistic interpretation retain separate authority. Opening a fictional door is not a real-world occurrence.
          </p>
        </details>
        {error && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      </div>
    </div>
  );
}
