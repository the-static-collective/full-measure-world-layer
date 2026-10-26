import {DAYS,AREAS,TIMES,fresh,normalize,nextDay,record,summary} from './core.mjs';
const KEY='still-here-full-measure-seven-days-v1';
const $=id=>document.getElementById(id);
let state=fresh(),area='care',minutes=2,storageOK=true;
try{const old=localStorage.getItem(KEY);if(old)state=normalize(JSON.parse(old));}
catch{storageOK=false;}
function save(){
  if(!storageOK)return;
  try{localStorage.setItem(KEY,JSON.stringify(state));}
  catch{storageOK=false;$('status').textContent='Storage is blocked. This visit still works, but cannot be saved.';}
}
function draw(){
  const d=nextDay(state),done=d===8;
  $('daytag').textContent=done?'SEVEN DAYS RETURNED':`DAY ${d} OF 7`;
  $('daytitle').textContent=done?'A place to return':DAYS[d-1].title;
  $('dayquestion').textContent=done?'Nothing here determines your worth.':DAYS[d-1].question;
  $('play').hidden=done;$('finished').hidden=!done;
  $('steps').replaceChildren();
  for(let n=1;n<=7;n++){
    const s=document.createElement('span');
    s.className='step'+(n<d?' done':n===d?' now':'');
    s.setAttribute('aria-label',`Day ${n}: ${n<d?'recorded':n===d?'current':'not started'}`);
    $('steps').append(s);
  }
  if(done){
    const s=summary(state);
    $('finishstats').textContent=`You made ${s.total} private check-ins: ${s.tended} acts of tending and ${s.rested} deliberate rests. These are not scores.`;
    return;
  }
  area='care';minutes=2;
  $('choices').replaceChildren();
  for(const [key,label] of Object.entries(AREAS)){
    const b=document.createElement('button');b.type='button';b.className='choice';b.dataset.area=key;
    const strong=document.createElement('strong'),desc=document.createElement('span');
    strong.textContent=label;desc.textContent=DAYS[d-1][key];b.append(strong,desc);
    b.addEventListener('click',()=>{area=key;refresh();});$('choices').append(b);
  }
  $('times').replaceChildren();
  for(const t of TIMES){
    const b=document.createElement('button');b.type='button';b.textContent=t+' minutes';b.dataset.minutes=String(t);
    b.addEventListener('click',()=>{minutes=t;refresh();});$('times').append(b);
  }
  refresh();
}
function refresh(){
  for(const b of $('choices').children)b.setAttribute('aria-pressed',String(b.dataset.area===area));
  for(const b of $('times').children)b.setAttribute('aria-pressed',String(Number(b.dataset.minutes)===minutes));
}
function checkin(kind){
  try{state=record(state,{area,minutes,kind});save();draw();$('status').textContent=kind==='rested'?'Rest belongs. You can return whenever you choose.':'Your small return is recorded on this device.';}
  catch{$('status').textContent='This check-in could not be recorded.';}
}
$('tend').addEventListener('click',()=>checkin('tended'));
$('rest').addEventListener('click',()=>checkin('rested'));
$('pause').addEventListener('click',()=>{$('status').textContent='Nothing was recorded. This day remains open.';});
$('clear').addEventListener('click',()=>{
  if(!confirm('Clear all seven-day check-ins from this browser? This cannot be undone.'))return;
  state=fresh();try{localStorage.removeItem(KEY);}catch{}
  draw();$('status').textContent='This device’s check-ins have been cleared.';
});
$('print').addEventListener('click',()=>window.print());
draw();
if(!storageOK)$('status').textContent='Local storage is unavailable. Check-ins last only for this visit.';