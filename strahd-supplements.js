(function(root){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections=['features','actions','bonus_actions','reactions','legendary_actions','lair_actions','regional_effects'];
function prepare(pack,map,library,parseSlots,npcMap){
 const records=structuredClone(pack.monsters),missing=[],seen=new Map();
 for(const ref of pack.references){
  const base=map.get(ref.baseName.toLowerCase());
  if(!base){missing.push(ref);continue;}
  if(seen.has(ref.baseName)){seen.get(ref.baseName)._sourceFiles.push(...ref.sources);continue;}
  const row=library.find(m=>m.name===base.name),full=structuredClone(base);
  full.name=base.name+' · Страд';full.baseName=base.name;full._customMonster=true;full._supplementPack=pack.id;full._sourceFiles=ref.sources.slice();
  full.hpFormula=row?.hpFormula||base.hpFormula||String(base.hpAvg||base.hp||1);full.initBonus=row?.initBonus??base.stats?.dex?.mod??0;
  full.spellSlots={...parseSlots(base.description||''),...full.spellSlots};
  for(const key of sections)for(const entry of full[key]||[])if(/заклинан|колдовство|spellcasting/i.test(entry.name))Object.assign(full.spellSlots,parseSlots(entry._displayDescription??entry.description??''));
  const npc=npcMap.get(base.name.toLowerCase().split('/')[0].trim());
  if(npc)npcMap.set(full.name.toLowerCase().split('/')[0].trim(),new Set(npc));
  seen.set(ref.baseName,full);records.push(full);
 }
 return {records,missing,unreadable:pack.unreadable||[],issues:pack.issues||[]};
}
function spellLabel(name,findSpell){const spell=findSpell?.(name);const label=String(spell?.spellName||spell?.name||name);const parts=label.split(/\s*\/\s*/);return parts.find(p=>/[а-яё]/i.test(p))?.trim()||parts[0].trim();}
function resources(full,c,container,save,findSpell,showSpell){
 if(!full._supplementPack)return;
 if(!document.getElementById('supplement-resource-style')){
  const style=document.createElement('style');style.id='supplement-resource-style';style.textContent='.supplement-resources button{font:inherit;font-size:13px;color:#8bd9ed;background:#243748;border:1px solid #365168;border-radius:7px;padding:5px 8px;cursor:pointer}.supplement-resources button:hover{background:#304b60}.supplement-resources button:focus-visible{outline:2px solid #dac078;outline-offset:2px}.supplement-spell-group{display:grid;grid-template-columns:140px minmax(0,1fr);gap:12px;align-items:start;padding:12px;margin:8px 0;background:rgba(46,68,88,.2);border-radius:10px}.supplement-spell-group>strong{font-size:12px;color:#b9cad9;padding-top:5px}.supplement-spell-items{display:flex;flex-wrap:wrap;gap:8px}.supplement-spell-item{display:inline-flex;flex-wrap:wrap;gap:5px;align-items:center}@media(max-width:600px){.supplement-spell-group{grid-template-columns:1fr;gap:6px;padding:9px}.supplement-resources button{font-size:12px}}';document.head.append(style);
 }
 const host=document.createElement('section');host.className='supplement-resources';
 host.style.cssText='margin:12px 0;padding:12px;border:1px solid #385065;border-radius:12px';
 const source=(full._sourceFiles||[]).map(s=>s.file+' · стр. '+s.page).filter((v,i,a)=>a.indexOf(v)===i);
 let html='<details><summary>Источник и примечания</summary><p>'+source.map(esc).join('<br>')+'</p>'+(full._sourceNotes||[]).map(n=>'<p>'+esc(n)+'</p>').join('');
 if(full._sourceStatblock)html+='<details><summary>Текст статблока из PDF</summary><p>'+esc(full._sourceStatblock)+'</p></details>';
 html+='</details>';
 if(c){
  c.supplementUses||={};
  const slots=Object.entries(c.spellSlots||{}).filter(([k])=>/^\d+$/.test(k));
  if(slots.length)html+='<p><strong>Ячейки этого участника боя</strong></p>'+slots.map(([k,s])=>'<div style="display:flex;gap:8px;align-items:center;margin:6px 0"><span>'+esc(k)+' ур. · '+(s.max-s.used)+' / '+s.max+'</span><button data-slot="'+k+'" data-delta="1">−</button><button data-slot="'+k+'" data-delta="-1">+</button></div>').join('');
 }
 for(const [i,g] of (full.spellGroups||[]).entries()){
  const daily=g.label.match(/(\d+)\s*\/\s*(?:день|сутки)/i);
  html+='<section class="supplement-spell-group"><strong>'+esc(g.label)+'</strong><div class="supplement-spell-items">';
  for(const [j,name] of g.spells.entries()){
   const key=i+':'+j,used=c?.supplementUses?.[key]||0,max=daily?Number(daily[1]):0;
   html+='<span class="supplement-spell-item"><button data-spell-group="'+i+'" data-spell-index="'+j+'">'+esc(spellLabel(name,findSpell))+'</button>';
   if(max&&c)html+='<span>'+Math.max(0,max-used)+' / '+max+'</span><button data-use="'+key+'" data-max="'+max+'" data-delta="1">−</button><button data-use="'+key+'" data-max="'+max+'" data-delta="-1">+</button>';
   html+='</span>';
  }
  html+='</div></section>';
 }
 if(!c&&(full.spellGroups?.length||Object.keys(full.spellSlots||{}).length))html+='<p><small>Добавь существо в бой, чтобы отмечать ячейки и дневные использования.</small></p>';
 host.innerHTML=html;container.prepend(host);
 host.querySelectorAll('[data-spell-group]').forEach(b=>b.onclick=()=>{const s=findSpell(full.spellGroups[b.dataset.spellGroup].spells[b.dataset.spellIndex]);if(s)showSpell(s);});
 if(c){
  const redraw=()=>{save();host.remove();resources(full,c,container,save,findSpell,showSpell);};
  host.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const s=c.spellSlots[b.dataset.slot];s.used=Math.max(0,Math.min(s.max,(s.used||0)+Number(b.dataset.delta)));redraw();});
  host.querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{const k=b.dataset.use;c.supplementUses[k]=Math.max(0,Math.min(Number(b.dataset.max),(c.supplementUses[k]||0)+Number(b.dataset.delta)));redraw();});
 }
}
root.StrahdSupplements={prepare,resources,spellLabel};if(typeof module!=='undefined')module.exports=root.StrahdSupplements;
})(typeof window==='undefined'?globalThis:window);
