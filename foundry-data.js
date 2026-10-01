(function(root){
'use strict';
let loading;
async function load(){
 if(!loading)loading=(async()=>{
  const manifest=await fetch('foundry-data.json?v=1').then(r=>{if(!r.ok)throw Error('Foundry data unavailable');return r.json();});
  const pieces=await Promise.all(manifest.files.map(p=>fetch(p+'?v='+manifest.version).then(r=>{if(!r.ok)throw Error('Missing Foundry data part');return r.text();})));
  const bytes=Uint8Array.from(atob(pieces.join('')),c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return JSON.parse(await new Response(stream).text());
 })().catch(error=>{console.warn('Foundry data fallback',error);return {monsters:[],spells:[]};});
 return loading;
}
function applyMonster(base,raw){
 const m={...base,...raw,image:base.image||null,description:base.description||''};
 // Previous guessed sections must not overwrite explicit raw/source sections.
 delete m._sectionRules;delete m._sourceLegendaryCount;delete m._regularActionNames;
 m._sourceLegendaryCount=raw.legendaryCount;
 return m;
}
function parameter(value){return [value?.value,value?.units].filter(v=>v!==undefined&&v!==null&&v!=='').join(' ');}
const times={action:'действие',bonus:'бонусное действие',reaction:'реакция',minute:'мин.',hour:'ч.',special:'Особое — см. описание'};
function applySpell(spell,raw){
 const props=raw.properties||[];const activation=raw.activation||{};
 return {...spell,uuid:raw.uuid,level:raw.level,castingTime:[activation.value,times[activation.type]||activation.type].filter(v=>v!==undefined&&v!==null&&v!=='').join(' '),range:parameter(raw.range),duration:parameter(raw.duration),description:raw.description,
 components:{verbal:props.includes('vocal'),somatic:props.includes('somatic'),material:props.includes('material'),materialDesc:raw.materials?.value||null},ritual:props.includes('ritual'),concentration:props.includes('concentration'),
 subclasses:[...new Set([...(spell.subclasses||[]),...(raw.grantedSubclasses||[])])],_foundryRaw:true};
}
const api={load,applyMonster,applySpell};root.FoundryData=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
