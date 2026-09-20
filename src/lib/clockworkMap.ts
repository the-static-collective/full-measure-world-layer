/** CLOCKWORK-MAP-001: independently sourced event projections; no new world authority. */
export type OccurrenceRef = { occurrenceId: string; sourceRef: string; occurredUtc: string };
export type MapProjection = {
  projectionId: string;
  occurrenceId: string;
  axis: 'time' | 'place' | 'relation' | 'narrative';
  methodRef: string;
  sourceRef: string;
  displayLabel: string;
};
export type ClockworkMap = {
  schema: 'full-measure.clockwork-map/0.1';
  occurrence: OccurrenceRef;
  layers: Record<MapProjection['axis'], MapProjection[]>;
  nonClaims: string[];
};
const required=(x:string,name:string)=>{if(typeof x!=='string'||!x.trim()||x.length>256)throw Error(name+' required');return x;};
export function projectClockworkMap(event:OccurrenceRef,projections:readonly MapProjection[]):ClockworkMap {
  required(event.occurrenceId,'occurrenceId'); required(event.sourceRef,'event sourceRef');
  if(!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(event.occurredUtc) ||
     !Number.isFinite(Date.parse(event.occurredUtc)) ||
     new Date(event.occurredUtc).toISOString().replace('.000Z', 'Z')!==event.occurredUtc)throw Error('verified explicit UTC syntax required');
  if(!Array.isArray(projections)||projections.length>100)throw Error('bounded projections required');
  const seen=new Set<string>();
  const layers:ClockworkMap['layers']={time:[],place:[],relation:[],narrative:[]};
  for(const p of projections){
    required(p.projectionId,'projectionId');required(p.sourceRef,'projection sourceRef');
    required(p.methodRef,'methodRef');required(p.displayLabel,'displayLabel');
    if(seen.has(p.projectionId))throw Error('duplicate projection identity');
    seen.add(p.projectionId);
    if(p.occurrenceId!==event.occurrenceId)throw Error('projection does not refer to source occurrence');
    if(!Object.hasOwn(layers,p.axis))throw Error('unknown projection axis');
    layers[p.axis].push({...p});
  }
  return {schema:'full-measure.clockwork-map/0.1',occurrence:{...event},layers,
    nonClaims:['navigation does not confer causal or historical identity',
      'a calendar coordinate is not an occurrence', 'world projection does not admit a Deed or grant traversal authority']};
}
