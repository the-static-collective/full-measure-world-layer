// STILL HERE × FULL MEASURE — Seven Days of Returning.
// This is an entirely local, self-attested practice ledger. Not a witnessed Deed.
export const DAYS = Object.freeze([
  {title:'Arrive',question:'What is still within reach?',care:'Drink water, breathe, or rest.',home:'Clear one small space.',craft:'Set out one tool or instrument.',commons:'Imagine a small helpful act without naming anyone.'},
  {title:'Make room',question:'What could make this hour easier?',care:'Step outside or stretch gently.',home:'Put away three things.',craft:'Practice one small part of a skill.',commons:'Explore one volunteer role, without a commitment.'},
  {title:'Find footing',question:'What ordinary thing can you depend on?',care:'Prepare a snack or a break.',home:'Make one daily task simpler.',craft:'Repair or organize a tool.',commons:'Sketch a fictional neighbor-help idea.'},
  {title:'Use your hands',question:'What can you tend or make?',care:'Move gently or choose stillness.',home:'Tend a plant or useful surface.',craft:'Make a tiny drawing, sound, or draft.',commons:'Draft a no-pressure invitation without names.'},
  {title:'Leave a light',question:'What might help you return?',care:'Do something kind for your future self.',home:'Set out something useful for tomorrow.',craft:'Write a brief how-to for yourself.',commons:'Consider a fictional safety-review task.'},
  {title:'Share capacity',question:'What can be offered freely, if anything?',care:'Honor a genuine need for rest.',home:'Set a reasonable boundary on one chore.',craft:'Teach an imaginary beginner one step.',commons:'Consider a voluntary Open Seat—or decline.'},
  {title:'Return',question:'What will you carry forward?',care:'Choose one form of self-care to revisit.',home:'Name a manageable upkeep ritual.',craft:'Keep one craft practice.',commons:'Explore stewardship without enrolling.'}
]);
export const AREAS = Object.freeze({care:'Tend yourself',home:'Tend your space',craft:'Tend your craft',commons:'Tend your community'});
export const TIMES = Object.freeze([2,5,15]);
export const fresh = () => ({version:1,entries:[]});
export function normalize(v) {
  if (!v || v.version !== 1 || !Array.isArray(v.entries) || v.entries.length > 7) return fresh();
  const entries=[];
  for(const e of v.entries){
    if (!e || e.day !== entries.length+1 || !Object.hasOwn(AREAS,e.area) || !TIMES.includes(e.minutes) || !['tended','rested'].includes(e.kind)) return fresh();
    entries.push({day:e.day,area:e.area,minutes:e.minutes,kind:e.kind});
  }
  return {version:1,entries};
}
export const nextDay = v => normalize(v).entries.length+1;
export function record(v, choice){
  const state=normalize(v), day=nextDay(state);
  if(day>7 || !choice || !Object.hasOwn(AREAS,choice.area) || !TIMES.includes(choice.minutes) || !['tended','rested'].includes(choice.kind)) throw Error('Invalid private check-in');
  return {version:1,entries:[...state.entries,{day,area:choice.area,minutes:choice.minutes,kind:choice.kind}]};
}
export function summary(v){
  const entries=normalize(v).entries;
  return {total:entries.length,tended:entries.filter(e=>e.kind==='tended').length,rested:entries.filter(e=>e.kind==='rested').length,areas:[...new Set(entries.map(e=>e.area))]};
}

