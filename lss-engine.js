(function(root){
'use strict';
const keys=['str','dex','con','int','wis','cha'];
const scalar=v=>v?.value??v;
function number(v,fallback=0){v=scalar(v);return v!==''&&v!=null&&Number.isFinite(Number(v))?Number(v):fallback;}
// Arithmetic parser: no eval, JavaScript execution or property access.
function expression(input,vars={}){
 if(typeof input==='number')return input;
 let text=String(scalar(input)??'').trim().replace(/−/g,'-').replace(/\[([\w.]+)\]/g,(_,key)=>{key=key.toUpperCase();if(!(key in vars))throw Error('Неизвестная переменная '+key);return '('+vars[key]+')';});
 const tokens=text.match(/\d+(?:\.\d+)?|[A-Za-z]+|[()+*/%,−-]/g)||[];
 if(tokens.join('')!==text.replace(/\s/g,''))throw Error('Неподдерживаемая формула '+text);
 let i=0;
 const functions={min:Math.min,max:Math.max,floor:Math.floor,ceil:Math.ceil,round:Math.round,abs:Math.abs};
 function atom(){const token=tokens[i++];if(token==='+'||token==='-')return (token==='-'?-1:1)*atom();if(token==='('){const n=add();if(tokens[i++]!==')')throw Error('Скобки');return n;}if(functions[token]){if(tokens[i++]!=='(')throw Error('Функция');const args=[add()];while(tokens[i]===','){i++;args.push(add());}if(tokens[i++]!==')')throw Error('Скобки');return functions[token](...args);}if(token!=null&&/^\d/.test(token))return Number(token);throw Error('Неверная формула');}
 function mul(){let n=atom();while(['*','/','%'].includes(tokens[i])){const op=tokens[i++],r=atom();n=op==='*'?n*r:op==='/'?n/r:n%r;}return n;}
 function add(){let n=mul();while(['+','-'].includes(tokens[i])){const op=tokens[i++],r=mul();n=op==='+'?n+r:n-r;}return n;}
 const result=add();if(i!==tokens.length||!Number.isFinite(result))throw Error('Неверная формула');return result;
}
function variables(data){const v={LVL:number(data.info?.level,1),LEVEL:number(data.info?.level,1),PB:number(data.proficiency,2),PROF:number(data.proficiency,2)};for(const key of keys){v[key.toUpperCase()]=Math.floor((number(data.stats?.[key]?.score,10)-10)/2);v[key.toUpperCase()+'_SCORE']=number(data.stats?.[key]?.score,10);}return v;}
function resolve(source){
 const d=structuredClone(source);if(d._trackerLssResolved)return d;
 d.stats||={};
 const warnings=[],bonuses=Array.isArray(d.bonuses)?d.bonuses:[];
 function apply(target,base){let value=base;for(const b of bonuses.filter(b=>b.target===target)){
  if(b.value==null&&(b.expr==null||b.expr===''))continue;
  try{const n=expression(b.expr??b.value,variables(d));switch(b.mode||'add'){case 'add':value+=n;break;case 'set':value=n;break;case 'upgrade':case 'max':value=Math.max(value,n);break;case 'multiply':value*=n;break;default:throw Error('Режим '+b.mode);}}catch(e){warnings.push(target+': '+e.message);}
 }return value;}
 function read(v,fallback){if(scalar(v)==null||scalar(v)==='')return fallback;try{return expression(v,variables(d));}catch(e){warnings.push(e.message);return fallback;}}
 for(const key of keys){d.stats[key]||={score:10};d.stats[key].score=apply('stat.'+key+'.score',number(d.stats[key].score,10));d.stats[key].modifier=Math.floor((d.stats[key].score-10)/2);}
 d.proficiency=apply('proficiency',number(d.proficiency,2));
 d.vitality||={};d._trackerAcFormula=typeof scalar(d.vitality.ac)==='string'&&String(scalar(d.vitality.ac)).includes('[')?scalar(d.vitality.ac):null;d.vitality.ac={...(d.vitality.ac||{}),value:apply('ac',read(d.vitality.ac,10+variables(d).DEX))};
 d.vitality['hp-max']={...(d.vitality['hp-max']||{}),value:apply('hp.max',read(d.vitality['hp-max'],0))};
 d.vitality.speed={...(d.vitality.speed||{}),value:apply('speed.walk',read(d.vitality.speed,30))};
 d.saves||={};d.skills||={};
 for(const key of keys){const save=d.saves[key]||={};save.isProf=apply('prof.save.'+key,save.isProf?1:0)>0;save.bonus=apply('save.'+key,number(save.bonus));}
 for(const [key,skill] of Object.entries(d.skills)){skill.isProf=apply('prof.skill.'+key,skill.isProf===2?2:skill.isProf?1:0);skill.bonus=apply('skill.'+key,number(skill.bonus));}
 d.spells||={};for(let level=1;level<=9;level++){const key='slots-'+level,slot=d.spells[key]||{},max=apply('spellSlot.'+level,number(slot.value));if(max>0||key in d.spells)d.spells[key]={...slot,value:Math.max(0,max)};}
 const ability=d.spellsInfo?.base?.code||'cha',vars=variables(d),attack=number(d.proficiency,2)+(vars[ability.toUpperCase()]||0);
 d._trackerSpellAttack=apply('spell.attack',read(d.spellsInfo?.mod,attack));d._trackerSpellDc=apply('spell.dc',read(d.spellsInfo?.save,8+attack));
 d._trackerInitiative=apply('initiative',read(d.vitality?.initiative??d.initiative,vars.DEX));
 for(const w of d.weaponsList||[]){const abilityMod=vars[String(w.ability||'').toUpperCase()]||0;w.mod={...(w.mod||{}),value:apply('weapon.'+w.id+'.attack',read(w.mod,abilityMod+(w.isProf?number(d.proficiency,2):0)))};}
 d._trackerProficiencies=bonuses.filter(b=>/^prof\.(weapon|armor|tool)/.test(b.target)).map(b=>({target:b.target,rank:apply(b.target,0)})).filter(b=>b.rank>0);
 const supported=t=>/^prof\.(weapon|armor|tool)/.test(t)||/^stat\.(str|dex|con|int|wis|cha)\.score$/.test(t)||['proficiency','ac','hp.max','speed.walk','initiative','spell.attack','spell.dc'].includes(t)||/^prof\.save\./.test(t)||/^prof\.skill\./.test(t)||/^save\./.test(t)||/^skill\./.test(t)||/^spellSlot\.\d+$/.test(t)||/^weapon\..+\.attack$/.test(t);
 for(const b of bonuses)if((b.expr!=null||b.value!=null)&&!supported(b.target))warnings.push('Бонус не распознан: '+b.target);
 d._trackerAcExtra=0;
 if(d._trackerAcFormula){try{d._trackerAcExtra=d.vitality.ac.value-expression(d._trackerAcFormula,variables(d));}catch(e){d._trackerAcFormula=null;}}
 d._trackerWarnings=[...new Set(warnings)];d._trackerLssResolved=1;return d;
}
root.LssEngine={expression,resolve,variables};if(typeof module!=='undefined'&&module.exports)module.exports=root.LssEngine;
})(typeof globalThis!=='undefined'?globalThis:window);
