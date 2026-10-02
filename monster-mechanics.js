(function(root){
'use strict';
function text(value){
 if(value===undefined||value===null)return '';
 if(typeof value==='string')return value.replace(/\[object Object\]\s*[;,]?\s*/gi,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
 if(typeof value==='number')return String(value);
 if(Array.isArray(value)||value instanceof Set)return [...value].map(text).filter(Boolean).join(', ');
 if(typeof value==='object'){for(const k of ['text','description','value','data','content'])if(value[k]!==undefined)return text(value[k]);return '';}
 return '';
}
function casting(m){
 const entries=['features','actions','bonus_actions','reactions','legendary_actions'].flatMap(k=>m[k]||[]).filter(e=>/заклинан|колдовство|spellcasting/i.test(e.name));
 const result=[];
 for(const e of entries){const source=text(e._displayDescription??e.description);const dc=source.match(/(?:СЛ(?:\s+(?:спасброск[аиов]*|испытани[яйе])(?:\s+(?:против|от)\s+заклинани[яй])?)?|сложность спасброска|spell save DC)\s*[:=]?\s*(\d+)/i)||source.match(/(?:^|[\s(])СЛ\s*[а-яёa-z \u2010-\u2014-]{0,65}[:=]?\s*(\d+)/i);const attack=source.match(/([+−-]\d+)\s*\)?\s*(?:к попаданию|к броск(?:ам|у) атаки|к атаке|to hit with spell)|(?:атака заклинаниями|spell attack(?: modifier)?)\s*[:=]?\s*([+−-]?\d+)/i);if(dc||attack)result.push({name:e.name,dc:dc?Number(dc[1]):null,attack:attack?Number((attack[1]||attack[2]).replace('−','-')):null});}
 if(!result.length&&(m.spellSaveDC||m.spellAttack!==undefined)&&(entries.length||m.spells?.length))result.push({name:'Заклинания',dc:m.spellSaveDC??null,attack:m.spellAttack??null});
 return result;
}
function limits(m){
 const resistance=(m.features||[]).find(e=>/легендарн(?:ая устойчивость|ое сопротивление)|legendary resistance/i.test(e.name));
 const resistanceMax=Number(m.legendaryResistanceCount)||Number(text(resistance?.name+' '+(resistance?.description||'')).match(/(\d+)\s*(?:\/\s*день|раз[а]?\s*в\s*день|\/\s*day|\/\s*сут)/i)?.[1])||0;
 const actionsMax=m.legendary_actions?.length?Number(m.legendaryCount||m._sourceLegendaryCount)||Number(text(m.legendary_actions).match(/(?:совершить|совершает|использовать|take)\s+(\d+)\s+(?:легендарн|legendary)/i)?.[1])||0:0;
 return {resistance:resistanceMax,actions:actionsMax};
}
function ensure(c,m,round){const max=limits(m);c.legendaryResources||={};for(const [key,limit] of Object.entries(max)){if(!limit){delete c.legendaryResources[key];continue;}const r=c.legendaryResources[key]||={used:0};r.max=limit;r.used=Math.min(limit,Math.max(0,r.used||0));if(key==='actions'&&r.round!==round){r.used=0;r.round=round;}}return c.legendaryResources;}
function spend(c,key,amount=1){const r=c.legendaryResources?.[key];if(!r||r.used+amount>r.max||amount<1)return false;r.used+=amount;return true;}
root.MonsterMechanics={text,casting,limits,ensure,spend};if(typeof module!=='undefined')module.exports=root.MonsterMechanics;
})(typeof window==='undefined'?globalThis:window);
