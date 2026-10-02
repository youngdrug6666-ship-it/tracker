(function(root){
'use strict';
function ensure(all){
 const groups=new Map();
 for(const c of all){
  if(!c.isMonster)continue;
  const key=String(c.name||'Существо').trim().toLowerCase();
  if(c.monsterNumberGroup!==key){delete c.monsterNumber;c.monsterNumberGroup=key;}
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(c);
 }
 for(const members of groups.values()){
  const used=new Set();
  for(const c of members){if(Number.isInteger(c.monsterNumber)&&c.monsterNumber>0&&!used.has(c.monsterNumber))used.add(c.monsterNumber);else delete c.monsterNumber;}
  for(const c of members)if(!c.monsterNumber){let n=1;while(used.has(n))n++;c.monsterNumber=n;used.add(n);}
 }
}
function label(c){return String(c?.name||'Существо').split(/\s+\/\s+/)[0]+(c?.isMonster&&c.monsterNumber?' №'+c.monsterNumber:'');}
function effectSource(effect,all){
 const source=all.find(c=>String(c.id)===String(effect.casterId));
 return source?label(source):effect.casterName?effect.casterName+' (вне боя)':'Заклинатель вне боя';
}
function effectTooltip(effect,all){return effect.name+' · Наложил: '+effectSource(effect,all)+(effect.duration?' · Длительность: '+effect.duration:'')+(effect.concentration?' · Концентрация':'')+' · Нажмите ×, чтобы снять';}
const api={ensure,label,effectSource,effectTooltip};root.CombatLabels=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis==='object'?globalThis:window);
