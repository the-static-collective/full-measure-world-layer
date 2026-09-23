import {initialState,step,benchCapabilities} from './core.mjs';
let state=initialState();
const el=id=>document.getElementById(id);
const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(isError=false){
 el('inventory').innerHTML=Object.entries(state.inventory).map(([k,v])=>`<span class="chip">${escapeHTML(k)} × ${v}</span>`).join('');
 el('message').textContent=state.last;el('message').classList.toggle('error',isError);
 el('lensLabel').textContent=state.telescope?'TELESCOPE':'EMPTY MOUNT';
 el('lensDetail').textContent=state.telescope?state.telescope.capabilities.join(' · '):'No telescope crafted';
 el('telescopeStatus').textContent=state.telescope?`Instrument ${state.telescope.id} v${state.telescope.version}: ${state.telescope.capabilities.join(', ')}`:state.bench.instruments.length?'Telescope transferred to the bench.':'No instrument yet.';
 el('sigA').textContent=state.observations.prismA?.signature||'unknown / not retained';
 el('sigB').textContent=state.observations.prismB?.signature||'unknown / not retained';
 el('benchStatus').textContent='BENCH CAPABILITIES: '+(benchCapabilities(state).join(' · ')||'none');
 el('artifactStatus').textContent='ARTIFACT: '+(state.artifact?`${state.artifact.id} / sourced from ${state.artifact.dependsOn.join(', ')}`:'none');
 el('doorSprite').classList.toggle('door-open',state.doorOpen);
 el('doorLabel').textContent=state.doorOpen?'DOOR OPEN':'SEALED DOOR';
 el('doorDetail').textContent=state.doorOpen?'Who taught its instruments to remember?':'A new question lies behind it.';
 el('receipts').innerHTML=state.events.length?state.events.map(e=>`<div class="receipt"><strong>${escapeHTML(e.id)}</strong> / ${escapeHTML(e.action.type)} / ${escapeHTML(e.evidenceClass)}<br>${escapeHTML(e.result)}</div>`).reverse().join(''):'<div class="minor">No occurrences yet.</div>';
}
document.querySelectorAll('button[data-action]').forEach(button=>button.addEventListener('click',()=>{
 const action={type:button.dataset.action};if(button.dataset.item)action.item=button.dataset.item;if(button.dataset.target)action.target=button.dataset.target;
 try{state=step(state,action);render(false);}catch(err){state.last=`HELD: ${err.message}`;render(true);}
}));
el('reset').addEventListener('click',()=>{state=initialState();render();});
el('export').addEventListener('click',()=>{
 const json=JSON.stringify({schema:'alchematrix-001/local-fictional-receipt',sourceWorld:'fixed-two-prism-specimen',...state},null,2);
 const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='alchematrix-001-receipt.json';a.click();URL.revokeObjectURL(url);
});
render();
