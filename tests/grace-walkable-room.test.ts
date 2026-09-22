import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {GRACE_ROOM_SCREEN_DOOR,GRACE_ROOM_SPOTS,ROOM_BOUNDS,START_ROOM_POSE,nearbyGraceRoomActions,stepGraceRoom} from '../src/lib/grace/walkableRoom.ts';
import {graceRoomVertexCount} from '../src/lib/grace/walkableRoomRenderer.ts';
import {GraceWalkableRoom} from '../src/components/GraceWalkableRoom.tsx';
import {GracePlaySurface} from '../src/components/GracePlaySurface.tsx';
import {derivePlayActions} from '../specimens/grace-001/playExperience.ts';
import {emptySession} from '../specimens/grace-001/session.ts';

const actions=derivePlayActions(emptySession());
const ids=actions.map(a=>a.id);

test('3D geometry contains complete triangles without creating a gameplay action',()=>{
 const count=graceRoomVertexCount();
 assert.ok(count>150);assert.equal(count%3,0);
 assert.equal(GRACE_ROOM_SPOTS.length,4);
 assert.equal(GRACE_ROOM_SCREEN_DOOR.closed,true);
 assert.equal(GRACE_ROOM_SCREEN_DOOR.traversable,false);
 assert.equal(GRACE_ROOM_SCREEN_DOOR.worldGate,false);
});

test('movement stays in bounds and respects the table footprint',()=>{
 let p={...START_ROOM_POSE};
 for(let i=0;i<80;i++)p=stepGraceRoom(p,'forward');
 assert.ok(p.z>=ROOM_BOUNDS.minZ&&p.z<=ROOM_BOUNDS.maxZ);
 assert.ok(p.x>=ROOM_BOUNDS.minX&&p.x<=ROOM_BOUNDS.maxX);
 // Table collision stops a head-on approach near the edge; its surface cannot be walked through.
 const stopped=stepGraceRoom({x:0,z:-.43,yaw:0},'forward');
 assert.equal(stopped.z,-.43);
 for(let i=0;i<80;i++)p=stepGraceRoom(p,'right');
 assert.ok(p.x<=ROOM_BOUNDS.maxX);
 assert.deepEqual(START_ROOM_POSE,{x:0,z:2.2,yaw:0});
});

test('human steering is reversible and invalid commands are rejected',()=>{
 const turned=stepGraceRoom(START_ROOM_POSE,'turn-right');
 assert.ok(turned.yaw>0);
 const restored=stepGraceRoom(turned,'turn-left');
 assert.ok(Math.abs(restored.yaw)<1e-12);
 assert.throws(()=>stepGraceRoom({...START_ROOM_POSE,x:NaN},'forward'),/INVALID_ROOM_POSE/);
 assert.throws(()=>stepGraceRoom(START_ROOM_POSE,'fly' as never),/INVALID_ROOM_MOVE/);
});

test('proximity can reveal only actions that Grace actually offers',()=>{
 assert.deepEqual(nearbyGraceRoomActions(START_ROOM_POSE,ids),[]);
 const chair=GRACE_ROOM_SPOTS.find(s=>s.id==='rest');
 assert.ok(chair);
 assert.deepEqual(nearbyGraceRoomActions({x:chair.x,z:chair.z,yaw:0},ids).map(s=>s.id).includes('rest'),true);
 assert.deepEqual(nearbyGraceRoomActions({x:chair.x,z:chair.z,yaw:0},[]),[]);
 // Explicit absence from Grace's hand cannot be overridden by a reachable prop.
 assert.equal(nearbyGraceRoomActions({x:chair.x,z:chair.z,yaw:0},['pray']).some(s=>s.id==='rest'),false);
});

test('room controls are accessible alternatives; object selection does not commit a session event',()=>{
 const html=renderToStaticMarkup(React.createElement(GraceWalkableRoom,{
  phase:'morning',actions,selectedActionId:null,onSelectAction:()=>{},
 }));
 assert.match(html,/Explore Grace&#x27;s Tuesday room/);
 assert.match(html,/Move forward/);
 assert.match(html,/Turn left/);
 assert.match(html,/Screen door · closed/);
 assert.match(html,/Nothing happens until you choose/);
 assert.match(html,/morning light/);
 assert.doesNotMatch(html,/Origin admission: not established/);
 assert.doesNotMatch(html,/X 0\.0 · Z 2\.2/);
 assert.doesNotMatch(html,/>Do it<\\/button>/);
 assert.match(html,/aria-label="3D room/);
});

test('selected action pauses movement; focused campaign retains ordinary action hand and preview',()=>{
 const room=renderToStaticMarkup(React.createElement(GraceWalkableRoom,{
  phase:'morning',actions,selectedActionId:'rest',onSelectAction:()=>{},
 }));
 assert.match(room,/disabled=""/);
 const campaign=renderToStaticMarkup(React.createElement(GracePlaySurface,{
  session:emptySession(),commit:()=>{},
 }));
 assert.match(campaign,/Walk the room/);
 assert.match(campaign,/What do you put in your hand/);
 assert.match(campaign,/Grace&#x27;s Tuesday room/);
});
