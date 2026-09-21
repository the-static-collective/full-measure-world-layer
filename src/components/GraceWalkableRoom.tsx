import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {DayPhase,PlayAction,PlayActionId} from '../../specimens/grace-001/playExperience.ts';
import {START_ROOM_POSE,GRACE_ROOM_SCREEN_DOOR,nearbyGraceRoomActions,stepGraceRoom,type RoomMove,type RoomPose} from '../lib/grace/walkableRoom.ts';
import {createGraceRoomRenderer,type GraceRoomRenderer} from '../lib/grace/walkableRoomRenderer.ts';

interface Props{
 phase:DayPhase;
 actions:PlayAction[];
 selectedActionId:PlayActionId|null;
 onSelectAction:(id:PlayActionId)=>void;
}
/** An optional spatial lens over Grace's existing actions, never a second engine. */
export function GraceWalkableRoom({phase,actions,selectedActionId,onSelectAction}:Props){
 const [pose,setPose]=useState<RoomPose>({...START_ROOM_POSE});
 const [renderError,setRenderError]=useState<string|null>(null);
 const canvas=useRef<HTMLCanvasElement|null>(null);
 const renderer=useRef<GraceRoomRenderer|null>(null);
 const focus=useRef<HTMLDivElement|null>(null);
 const locked=selectedActionId!==null;
 const nearby=useMemo(()=>nearbyGraceRoomActions(pose,actions.map(a=>a.id)),[pose,actions]);
 const move=(direction:RoomMove)=>{
  if(locked)return;
  setPose(current=>stepGraceRoom(current,direction));
 };
 useEffect(()=>{
  const target=canvas.current;
  if(!target)return;
  try{
   renderer.current=createGraceRoomRenderer(target);
   setRenderError(null);
   renderer.current.render(pose,phase);
  }catch(err){
   renderer.current=null;
   setRenderError(err instanceof Error?err.message:'Room renderer unavailable');
  }
  return()=>{renderer.current?.destroy();renderer.current=null;};
 // Renderer lifetime is the canvas lifetime; camera pose is updated below.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{
  renderer.current?.render(pose,phase);
 },[pose,phase]);
 useEffect(()=>{
  const resize=()=>renderer.current?.render(pose,phase);
  window.addEventListener('resize',resize);
  return()=>window.removeEventListener('resize',resize);
 },[pose,phase]);
 const onKeyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  if(locked||event.altKey||event.ctrlKey||event.metaKey)return;
  const keys:Record<string,RoomMove>={
   w:'forward',W:'forward',ArrowUp:'forward',s:'back',S:'back',ArrowDown:'back',
   a:'left',A:'left',d:'right',D:'right',q:'turn-left',Q:'turn-left',
   ArrowLeft:'turn-left',e:'turn-right',E:'turn-right',ArrowRight:'turn-right',
  };
  const direction=keys[event.key];
  if(!direction)return;
  // Never hijack keyboard input while focus is on a button or form control.
  if(event.target!==focus.current)return;
  event.preventDefault();move(direction);
 };
 return (
  <section className="grace-walk" aria-label="Explore Grace's Tuesday room">
   <div className="grace-walk__top">
    <div><p className="grace-walk__eyebrow">GRACE-001 · ROOM WALK</p><h2>A room already in motion</h2></div>
    <span className="grace-walk__phase">{phase} · fictional room</span>
   </div>
   <div className="grace-walk__viewport" ref={focus} tabIndex={0} onKeyDown={onKeyDown} aria-label="3D room. Use W A S D to move, Q and E to turn; arrow keys also work when this view is focused.">
    <canvas ref={canvas} role="img" aria-label="Procedural three-dimensional room with a table, telephone, groceries, chair and a closed screen door" />
    {renderError&&<p className="grace-walk__fallback" role="status">3D view unavailable. Use the ordinary action hand below; it has the same game options.</p>}
    <div className="grace-walk__reticle" aria-hidden="true">+</div>
    <span className="grace-walk__notice">The screen door is closed. Walking cannot authorize a Crossing.</span>
    <span className="grace-walk__coordinates" aria-hidden="true">X {pose.x.toFixed(1)} · Z {pose.z.toFixed(1)}</span>
   </div>
   <div className="grace-walk__foot">
    <div className="grace-walk__controls" aria-label="Room movement">
     <button type="button" disabled={locked} onClick={()=>move('turn-left')} aria-label="Turn left">↶</button>
     <button type="button" disabled={locked} onClick={()=>move('forward')} aria-label="Move forward">↑</button>
     <button type="button" disabled={locked} onClick={()=>move('turn-right')} aria-label="Turn right">↷</button>
     <button type="button" disabled={locked} onClick={()=>move('left')} aria-label="Step left">←</button>
     <button type="button" disabled={locked} onClick={()=>move('back')} aria-label="Move back">↓</button>
     <button type="button" disabled={locked} onClick={()=>move('right')} aria-label="Step right">→</button>
    </div>
    <div className="grace-walk__nearby" aria-live="polite">
     <p className="grace-walk__eyebrow">WITHIN REACH</p>
     {locked?<p>Preview selected. Choose “Do it” below, or unselect the action to keep exploring.</p>:
      nearby.length===0?<p>Move toward the telephone, groceries, quiet corner or chair. You may also use the action hand below.</p>:
      nearby.map(spot=>{
       const action=actions.find(a=>a.id===spot.id);
       return action?<button key={spot.id} type="button" onClick={()=>onSelectAction(spot.id)}>
        {spot.label} · {action.shortLabel} <span aria-hidden="true">↗</span>
       </button>:null;
      })
     }
     <p className="grace-walk__boundary">Object selection previews only. The Grace campaign decides which moves exist.</p>
    </div>
   </div>
   <p className="grace-walk__door-status" aria-label="Room exit status">
    Screen door: {GRACE_ROOM_SCREEN_DOOR.closed?'closed':'unknown'} · Origin admission: not established
   </p>
  </section>
 );
}
