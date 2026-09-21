import type {PlayActionId} from '../../../specimens/grace-001/playExperience.ts';

export interface RoomPose {x: number; z: number; yaw: number}
export type RoomMove = 'forward' | 'back' | 'left' | 'right' | 'turn-left' | 'turn-right';
export interface RoomSpot {id: PlayActionId; label: string; x: number; z: number; radius: number}

/** Only presentation positions. Every available action still comes from Grace's campaign. */
export const GRACE_ROOM_SPOTS: readonly RoomSpot[] = Object.freeze([
  {id:'return-client-call',label:'Telephone',x:-0.6,z:-1.25,radius:1.5},
  {id:'grocery-run',label:'Grocery bag',x:1.8,z:-2.2,radius:1.3},
  {id:'pray',label:'Quiet corner',x:-2.5,z:-2.4,radius:1.3},
  {id:'rest',label:'Resting chair',x:1.65,z:0.2,radius:1.3},
]);
export const START_ROOM_POSE: Readonly<RoomPose> = Object.freeze({x:0,z:2.2,yaw:0});
export const ROOM_BOUNDS = Object.freeze({minX:-3.45,maxX:3.45,minZ:-3.45,maxZ:3.45});
const TABLE = Object.freeze({minX:-1.40,maxX:0.50,minZ:-1.96,maxZ:-0.70});
const PLAYER_RADIUS = 0.24;
const STEP = 0.43;
const TURN = Math.PI / 9;

const validPose = (pose:RoomPose) =>
  Number.isFinite(pose.x) && Number.isFinite(pose.z) && Number.isFinite(pose.yaw);
function free(x:number,z:number):boolean {
  if(x<ROOM_BOUNDS.minX||x>ROOM_BOUNDS.maxX||z<ROOM_BOUNDS.minZ||z>ROOM_BOUNDS.maxZ)return false;
  const closestX=Math.max(TABLE.minX,Math.min(x,TABLE.maxX));
  const closestZ=Math.max(TABLE.minZ,Math.min(z,TABLE.maxZ));
  return (x-closestX)**2+(z-closestZ)**2>=PLAYER_RADIUS**2;
}
/** One explicit movement input; returns a new pose and cannot mutate a game session. */
export function stepGraceRoom(pose:RoomPose,move:RoomMove):RoomPose {
  if(!validPose(pose))throw new Error('INVALID_ROOM_POSE');
  if(move==='turn-left'||move==='turn-right'){
    const yaw=pose.yaw+(move==='turn-left'?-TURN:TURN);
    return {...pose,yaw:Math.atan2(Math.sin(yaw),Math.cos(yaw))};
  }
  const forwardX=Math.sin(pose.yaw),forwardZ=-Math.cos(pose.yaw);
  const sideX=Math.cos(pose.yaw),sideZ=Math.sin(pose.yaw);
  const [dx,dz]=move==='forward'?[forwardX,-Math.cos(pose.yaw)]:
    move==='back'?[-forwardX,Math.cos(pose.yaw)]:
    move==='right'?[sideX,sideZ]:
    move==='left'?[-sideX,-sideZ]:
    (()=>{throw new Error('INVALID_ROOM_MOVE')})();
  const candidateX=pose.x+dx*STEP,candidateZ=pose.z+dz*STEP;
  if(free(candidateX,candidateZ))return {...pose,x:candidateX,z:candidateZ};
  if(free(candidateX,pose.z))return {...pose,x:candidateX};
  if(free(pose.x,candidateZ))return {...pose,z:candidateZ};
  return {...pose};
}
/** Nearness alone cannot create an unavailable campaign action. */
export function nearbyGraceRoomActions(pose:RoomPose,available:readonly PlayActionId[]):RoomSpot[] {
  if(!validPose(pose))throw new Error('INVALID_ROOM_POSE');
  const allowed=new Set(available);
  return GRACE_ROOM_SPOTS.filter(s=>allowed.has(s.id)&&Math.hypot(s.x-pose.x,s.z-pose.z)<=s.radius)
    .sort((a,b)=>Math.hypot(a.x-pose.x,a.z-pose.z)-Math.hypot(b.x-pose.x,b.z-pose.z));
}
/** A painted screen door is explicitly not an interactive exit. */
export const GRACE_ROOM_SCREEN_DOOR = Object.freeze({x:3.9,z:-2.0,closed:true,traversable:false,worldGate:false});
