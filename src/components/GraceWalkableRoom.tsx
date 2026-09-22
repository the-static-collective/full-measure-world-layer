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

const phaseLine:Record<DayPhase,string>={
 morning:'The window is doing most of the talking.',
 midday:'The room has warmed into the middle of the day.',
 evening:'Long light is settling over the table.',
 night:'The room has gone quiet enough to hear itself.',
};

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
    <div>
     <p className="grace-walk__eyebrow">TUESDAY · YOUR ROOM</p>
     <h2>The room is already awake</h2>
     <p className="grace-walk__phase-line">{phaseLine[phase]}</p>
    </div>
    <span className="grace-walk__phase">{phase} light</span>
   </div>

   <div className="grace-walk__viewport" ref={focus} tabIndex={0} onKeyDown={onKeyDown}
    aria-label="3D room. Use W A S D to move, Q and E to turn; arrow keys also work when this view is focused.">
    <canvas ref={canvas} role="img" aria-label="Procedural three-dimensional room with a table, telephone, groceries, chair and a closed screen door" />
    {renderError&&<p className="grace-walk__fallback" role="status">3D view unavailable. Use the ordinary action hand below; it has the same game options.</p>}
    <div className="grace-walk__vignette" aria-hidden="true" />
    <div className="grace-walk__reticle" aria-hidden="true"><span /></div>
    <span className="grace-walk__keys" aria-hidden="true">WASD / arrows · Q E turn</span>
    <span className="grace-walk__room-note" aria-label="Screen door status">
     Screen door · {GRACE_ROOM_SCREEN_DOOR.closed?'closed':'unknown'}
    </span>
   </div>

   <div className="grace-walk__foot">
    <div className="grace-walk__movement">
     <p className="grace-walk__eyebrow">MOVE THROUGH THE ROOM</p>
     <div className="grace-walk__controls" aria-label="Room movement">
      <button type="button" disabled={locked} onClick={()=>move('turn-left')} aria-label="Turn left" data-control="turn-left">↶</button>
      <button type="button" disabled={locked} onClick={()=>move('forward')} aria-label="Move forward" data-control="forward">↑</button>
      <button type="button" disabled={locked} onClick={()=>move('turn-right')} aria-label="Turn right" data-control="turn-right">↷</button>
      <button type="button" disabled={locked} onClick={()=>move('left')} aria-label="Step left" data-control="left">←</button>
      <button type="button" disabled={locked} onClick={()=>move('back')} aria-label="Move back" data-control="back">↓</button>
      <button type="button" disabled={locked} onClick={()=>move('right')} aria-label="Step right" data-control="right">→</button>
     </div>
     <p className="grace-walk__movement-note">{locked?'Card in hand. Put it back or finish it before walking.':'Keyboard works whenever the room itself has focus.'}</p>
    </div>

    <div className="grace-walk__nearby" aria-live="polite">
     <p className="grace-walk__eyebrow">IN THE ROOM</p>
     {locked?<p className="grace-walk__quiet">You picked something up. Its card is open below.</p>:
      nearby.length===0?<p className="grace-walk__quiet">Walk toward the telephone, groceries, quiet corner, or chair. Something may come within reach.</p>:
      <div className="grace-walk__object-stack">
       {nearby.map(spot=>{
        const action=actions.find(a=>a.id===spot.id);
        return action?<button className="grace-walk__object-card" key={spot.id} type="button" onClick={()=>onSelectAction(spot.id)}>
         <span className="grace-walk__object-name">{spot.label}</span>
         <strong>{action.shortLabel}</strong>
         <span className="grace-walk__object-prompt">pick up <span aria-hidden="true">→</span></span>
        </button>:null;
       })}
      </div>
     }
     <p className="grace-walk__boundary">Selecting an object opens its card. Nothing happens until you choose “Do it” below.</p>
    </div>
   </div>
  </section>
 );
}
