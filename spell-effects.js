(function(root){
'use strict';
const name=s=>String(s.spellName||s.name||'').split(/\s+\/\s+/)[0];
const identity=s=>String(s.spellName||s.name||'').split(/\s+\/\s+/).pop().trim().toLowerCase();
function isMageArmor(s){return identity(s)==='mage armor';}
function remove(all,id){
 for(const c of all){c.activeSpellEffects=(c.activeSpellEffects||[]).filter(e=>e.id!==id);updateMonsterArmor(c);if(c.concentrationEffect===id){delete c.concentrationEffect;c.conditions?.delete('Концентрация');}}
}
function endConcentration(all,caster){if(caster.concentrationEffect)remove(all,caster.concentrationEffect);caster.conditions?.delete('Концентрация');}
function cast(all,{spell,casterId,targetId,slotLevel=null,unarmored=false}){
 const caster=all.find(c=>String(c.id)===String(casterId)),target=all.find(c=>String(c.id)===String(targetId));
 if(!caster||!target)throw Error('Выберите заклинателя и цель.');
 if(isMageArmor(spell)&&!unarmored)throw Error('Для Доспехов мага выберите цель без доспеха и подтвердите это.');
 let slot;if(slotLevel!=null){slot=caster.spellSlots?.[slotLevel];if(!slot||slot.max-(slot.used||0)<=0||Number(String(slotLevel).replace('pact-',''))<Number(spell.level))throw Error('Нет подходящей свободной ячейки.');}
 if(isMageArmor(spell)&&target.isMonster&&target.spellEffectBaseAc==null)target.spellEffectBaseAc=target.ac;
 if(spell.concentration)endConcentration(all,caster);
 if(slot)slot.used=(slot.used||0)+1;
 const id='cast-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
 const persistent=spell.concentration||isMageArmor(spell)||!/^\s*(inst|instantaneous|мгновенно)(?:\s|$)/i.test(spell.duration||'inst');
 if(persistent){target.activeSpellEffects||=[];
  if(isMageArmor(spell))target.activeSpellEffects=target.activeSpellEffects.filter(e=>e.kind!=='mageArmor');
  target.activeSpellEffects.push({id,name:name(spell),casterId:caster.id,concentration:!!spell.concentration,kind:isMageArmor(spell)?'mageArmor':'marker',duration:spell.duration||'',createdAt:Date.now()});
 }
 if(spell.concentration){caster.conditions||=new Set();caster.conditions.add('Концентрация');caster.concentrationEffect=id;}
 updateMonsterArmor(target);
 return {id,persistent};
}
function armorBase(c,base){return (c.activeSpellEffects||[]).some(e=>e.kind==='mageArmor')?13+Math.floor((Number(c.stats?.dex?.score||10)-10)/2):base;}
function updateMonsterArmor(c){if(!c.isMonster)return;if((c.activeSpellEffects||[]).some(e=>e.kind==='mageArmor')){c.ac=armorBase(c,c.ac);}else if(c.spellEffectBaseAc!=null){c.ac=c.spellEffectBaseAc;delete c.spellEffectBaseAc;}}
function availableSlots(caster,spell){return Object.entries(caster.spellSlots||{}).filter(([key,s])=>Number(spell.level)>0&&Number(key.replace('pact-',''))>=Number(spell.level)&&s.max-(s.used||0)>0).sort(([a],[b])=>Number(a.replace('pact-',''))-Number(b.replace('pact-',''))||Number(a.startsWith('pact-'))-Number(b.startsWith('pact-')));}
function defaultSlot(caster,spell){return availableSlots(caster,spell)[0]?.[0]||'';}
root.SpellEffects={cast,remove,endConcentration,armorBase,isMageArmor,updateMonsterArmor,availableSlots,defaultSlot};if(typeof module!=='undefined'&&module.exports)module.exports=root.SpellEffects;
})(typeof globalThis!=='undefined'?globalThis:window);
