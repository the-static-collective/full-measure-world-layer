import type {DayPhase} from '../../specimens/grace-001/playExperience.ts';
import type {RoomPose} from './walkableRoom.ts';

/** Procedural WebGL1 room. Camera movement changes presentation, never game state. */
type RGB=readonly [number,number,number];
const verts:number[]=[];
function face(a:number[],b:number[],c:number[],d:number[],color:RGB){
 for(const v of [a,b,c,a,c,d])verts.push(...v,...color);
}
function box(x:number,y:number,z,w:number,h:number,d,color:RGB){
 const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;
 const tint=(k:number):RGB=>[Math.min(1,color[0]*k),Math.min(1,color[1]*k),Math.min(1,color[2]*k)];
 face([a,c,f],[b,c,f],[b,e,f],[a,e,f],tint(.85));
 face([b,c,g],[a,c,g],[a,e,g],[b,e,g],tint(.96));
 face([a,c,g],[a,c,f],[a,e,f],[a,e,g],tint(.74));
 face([b,c,f],[b,c,g],[b,e,g],[b,e,f],tint(1.05));
 face([a,e,f],[b,e,f],[b,e,g],[a,e,g],tint(1.19));
 face([a,c,g],[b,c,g],[b,c,f],[a,c,f],tint(.73));
}
let geometry:Float32Array|undefined;
function roomGeometry(){
 if(geometry)return geometry;
 const wood:RGB=[.60,.37,.24],brown:RGB=[.34,.22,.16],wall:RGB=[.72,.66,.53],
 floor:RGB=[.50,.34,.23],cream:RGB=[.83,.78,.65],sage:RGB=[.34,.49,.42],
 sky:RGB=[.48,.67,.74],gold:RGB=[.83,.63,.37],dark:RGB=[.24,.36,.38];
 // Sealed 8m square room. Right-side screen door is a CLOSED LEAF, not a portal.
 box(0,-.13,0,8.2,.26,8.2,floor);
 box(0,2.91,0,8.2,.18,8.2,cream);
 box(-4.1,1.4,0,.2,2.9,8.2,wall);box(4.1,1.4,0,.2,2.9,8.2,wall);
 box(0,1.4,-4.1,8.2,2.9,.2,wall);box(0,1.4,4.1,8.2,2.9,.2,wall);
 for(const x of [-2,0,2])box(x,.06,0,.05,.07,8,wood);
 box(-2.6,1.7,-3.97,1.38,1.07,.08,brown);box(-2.6,1.7,-3.89,1.18,.86,.07,sky);
 box(-2.6,1.7,-3.82,.07,.9,.06,cream);box(-2.6,1.7,-3.82,1.20,.06,.06,cream);
 box(3.96,1.23,-2.05,.11,2.43,1.28,brown);box(3.87,1.23,-2.05,.08,2.14,1.04,sage);
 box(3.77,1.27,-1.58,.13,.13,.09,gold);
 // An already-used table with ordinary meal, telephone, and cup.
 box(-.50,.73,-1.30,1.8,.12,1.1,wood);
 for(const x of [-1.22,.21])for(const z of [-1.70,-.90])box(x,.34,z,.11,.64,.11,brown);
 box(-.55,.82,-1.30,.51,.06,.35,cream);box(-.55,.89,-1.30,.29,.06,.15,gold);
 box(-.75,.87,-.88,.26,.13,.18,dark);box(-.62,.96,-.88,.06,.04,.13,cream);
 box(0,.89,-1.35,.19,.28,.19,cream);
 // Distinct physical stations; action authority is checked separately by Grace.
 box(1.8,.40,-2.2,.50,.75,.35,gold);box(1.8,.81,-2.2,.38,.07,.08,brown);
 box(1.65,.48,.2,.83,.18,.84,sage);box(1.65,.91,.57,.83,.88,.16,sage);
 for(const x of [1.30,2])for(const z of [-.12,.53])box(x,.22,z,.09,.43,.09,brown);
 box(-2.5,.42,-2.4,.77,.81,.34,wood);box(-2.5,.89,-2.37,.29,.09,.25,cream);
 box(-2.5,1.38,-3.96,.70,.70,.08,brown);box(-2.5,1.38,-3.87,.53,.53,.06,sage);
 geometry=new Float32Array(verts);return geometry;
}
export function graceRoomVertexCount(){return roomGeometry().length/6;}
const VERTEX='attribute vec3 aPosition;attribute vec3 aColor;uniform vec3 uCamera;uniform float uYaw;uniform float uAspect;varying vec3 vColor;void main(){float c=cos(uYaw),s=sin(uYaw);vec3 d=aPosition-uCamera;vec3 v=vec3(d.x*c+d.z*s,d.y,-d.x*s+d.z*c);float depth=-v.z;float n=0.08,f=28.0;gl_Position=vec4(v.x*1.36/uAspect,v.y*1.36,depth*(f+n)/(f-n)-2.0*f*n/(f-n),depth);vColor=aColor;}';
const FRAGMENT='precision mediump float;varying vec3 vColor;uniform float uDaylight;void main(){gl_FragColor=vec4(vColor*uDaylight,1.0);}';
function shader(gl:WebGLRenderingContext,type:number,source:string){
 const s=gl.createShader(type);if(!s)throw new Error('ROOM_SHADER_UNAVAILABLE');
 gl.shaderSource(s,source);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const problem=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error('ROOM_SHADER_FAILED:'+problem);}
 return s;
}
export interface GraceRoomRenderer{render:(pose:RoomPose,phase:DayPhase)=>void;destroy:()=>void}
export function createGraceRoomRenderer(canvas:HTMLCanvasElement):GraceRoomRenderer{
 const gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'low-power'});
 if(!gl)throw new Error('WEBGL_UNAVAILABLE');
 const vs=shader(gl,gl.VERTEX_SHADER,VERTEX),fs=shader(gl,gl.FRAGMENT_SHADER,FRAGMENT);
 const program=gl.createProgram();if(!program)throw new Error('ROOM_PROGRAM_UNAVAILABLE');
 gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
 gl.deleteShader(vs);gl.deleteShader(fs);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('ROOM_LINK_FAILED');
 const buffer=gl.createBuffer();if(!buffer)throw new Error('ROOM_BUFFER_UNAVAILABLE');
 gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,roomGeometry(),gl.STATIC_DRAW);
 const pos=gl.getAttribLocation(program,'aPosition'),col=gl.getAttribLocation(program,'aColor');
 const cam=gl.getUniformLocation(program,'uCamera'),yaw=gl.getUniformLocation(program,'uYaw');
 const aspect=gl.getUniformLocation(program,'uAspect'),light=gl.getUniformLocation(program,'uDaylight');
 if(pos<0||col<0||!cam||!yaw||!aspect||!light)throw new Error('ROOM_BINDING_FAILED');
 let destroyed=false;
 return {render(pose,phase){
  if(destroyed)return;
  const ratio=Math.min(1.5,window.devicePixelRatio||1);
  const width=Math.max(1,Math.min(1600,Math.round(canvas.clientWidth*ratio)));
  const height=Math.max(1,Math.min(1000,Math.round(canvas.clientHeight*ratio)));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
  gl.viewport(0,0,width,height);gl.clearColor(.12,.16,.16,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(col);gl.vertexAttribPointer(col,3,gl.FLOAT,false,24,12);
  gl.uniform3f(cam,pose.x,1.58,pose.z);gl.uniform1f(yaw,pose.yaw);
  gl.uniform1f(aspect,width/height);gl.uniform1f(light,phase==='night'?.64:phase==='evening'?.80:phase==='midday'?.94:1);
  gl.drawArrays(gl.TRIANGLES,0,graceRoomVertexCount());
 },destroy(){if(destroyed)return;destroyed=true;gl.deleteBuffer(buffer);gl.deleteProgram(program);}};
}
