(function(root){
'use strict';
const abilities=['str','dex','con','int','wis','cha'];
const abilityLabels={str:'Сила',dex:'Ловкость',con:'Телосложение',int:'Интеллект',wis:'Мудрость',cha:'Харизма'};
const skillLabels={acrobatics:'Акробатика','animal-handling':'Уход за животными',arcana:'Магия',athletics:'Атлетика',deception:'Обман',history:'История',insight:'Проницательность',intimidation:'Запугивание',investigation:'Анализ',medicine:'Медицина',nature:'Природа',perception:'Восприятие',performance:'Выступление',persuasion:'Убеждение',religion:'Религия','sleight-of-hand':'Ловкость рук',stealth:'Скрытность',survival:'Выживание'};
const codes={acr:'acrobatics',ani:'animal-handling',arc:'arcana',ath:'athletics',dec:'deception',his:'history',ins:'insight',itm:'intimidation',inv:'investigation',med:'medicine',nat:'nature',prc:'perception',per:'persuasion',rel:'religion',slt:'sleight-of-hand',ste:'stealth',sur:'survival'};
const types={aberration:'Аберрация',beast:'Зверь',celestial:'Небожитель',construct:'Конструкт',dragon:'Дракон',elemental:'Элементаль',fey:'Фея',fiend:'Исчадие',giant:'Великан',humanoid:'Гуманоид',monstrosity:'Монстр',ooze:'Слизь',plant:'Растение',undead:'Нежить'};
const modes={walk:'Ходьба',fly:'Полёт',swim:'Плавание',burrow:'Копание',climb:'Лазание'};
const senses={blindsight:'Слепое зрение',darkvision:'Тёмное зрение',tremorsense:'Чувство вибрации',truesight:'Истинное зрение',passive_perception:'Пассивное восприятие'};
const languages={common:'Общий',draconic:'Драконий',dwarvish:'Дварфийский',elvish:'Эльфийский',giant:'Великанский',gnomish:'Гномий',goblin:'Гоблинский',halfling:'Полуросликов',orc:'Орочий',abyssal:'Бездны',celestial:'Небесный',infernal:'Инфернальный',primordial:'Первичный',sylvan:'Сильван',undercommon:'Подземный',deep_speech:'Глубинная речь',aquan:'Акван',auran:'Ауран',ignan:'Игнан',terran:'Терран',telepathy:'Телепатия'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clean(value,paragraphs=false){
 if(value==null)return '';let s=String(value);
 for(let i=0;i<3;i++)s=s.replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#0*39;|&apos;/gi,"'").replace(/&nbsp;/gi,' ').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
 s=s.replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'');
 s=s.replace(/(?:&|@)?(?:reference|eference)(?:\[[^\]]*\])?\{([^}]+)\}/gi,'$1');
 s=s.replace(/(?:&|@)reference\[([^\]]+)\]/gi,(_,x)=>({prone:'сбит с ног',frightened:'испуган',difficultterrain:'труднопроходимая местность',heavilyobscured:'сильно заслоняющая местность'}[x.toLowerCase()]||x));
 s=s.replace(/@(?:ActorEmbeddedItem|condition|spell|Item|Actor)\[[^\]]+\]\{([^}]+)\}/gi,'$1');
 s=s.replace(/@(?:UUID|Compendium)\[[^\]]+\]\{([^}]+)\}/gi,'$1').replace(/@(?:UUID|Compendium)\[[^\]]+\]/gi,'');
 s=s.replace(/\[\[\/(?:r|roll)\s+([^\]]+)\]\]/gi,'$1').replace(/\[\[\/damage\s+([^\]]+)\]\]/gi,(_,v)=>v.replace(/\s+type=\S+/g,''));
 s=s.replace(/\[\[lookup[^\]]+\]\]/gi,'').replace(/\{@\w+\s+([^}|]+)(?:\|[^}]+)?\}/g,'$1');
 s=s.replace(/\b(?:DEC|PER|SLT|PRC|INV|ARC|ITM|ACR|ANI|ATH|HIS|INS|MED|NAT|REL|STE|SUR)\b/g,x=>skillLabels[codes[x.toLowerCase()]]||x);
 s=s.replace(/\b(?:STR|DEX|CON|INT|WIS|CHA)\b/gi,x=>abilityLabels[x.toLowerCase()]);
 s=s.replace(/\b(?:walk|fly|swim|burrow|climb|blindsight|darkvision|tremorsense|truesight|hover)\b/gi,x=>modes[x.toLowerCase()]||senses[x.toLowerCase()]||(x.toLowerCase()==='hover'?'парение':x));
 s=s.replace(/\bft\.?/gi,'фт.').replace(/Аркана/g,'Магия').replace(/Расследование/g,'Анализ').replace(/Внимание/g,'Восприятие').replace(/Выносливость/g,'Телосложение').replace(/Выносливости/g,'Телосложения').replace(/Испытание\s*/g,'');
 return (paragraphs?s.replace(/[^\S\n]+/g,' ').replace(/\n\s*\n+/g,'\n').trim():s.replace(/\s+/g,' ').trim());
}
const norm=s=>clean(s).toLowerCase().replace(/ё/g,'е').replace(/\s*\([^)]*\)/g,'').trim();
function list(value){if(Array.isArray(value))return value.map(v=>clean(v)).filter(Boolean);if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${modes[k]||senses[k]||k}: ${clean(v)}`);return clean(value).split(/\s*[,;]\s*/).filter(x=>x&&x!=='—');}
function chips(value){const parts=list(value);return parts.length?parts.map(x=>`<span class="bestiary-chip">${esc(x)}</span>`).join(''):'<span class="bestiary-empty">Не указано</span>';}
function languageText(value){return clean(value).replace(/\b(common|draconic|dwarvish|elvish|giant|gnomish|goblin|halfling|orc|abyssal|celestial|infernal|primordial|sylvan|undercommon|deep_speech|deep speech|aquan|auran|ignan|terran|telepathy)\b/gi,x=>languages[x.toLowerCase().replace(' ','_')]||x);}
function srdKey(m){return String(m.name||'').split('/').at(-1).trim().toLowerCase().replace(/\s+/g,' ');}
function enrich(m,srd){
 if(!srd)return false;
 if(Number(m.cr)!==srd.cr || abilities.some((k,i)=>Number(m.stats?.[k]?.score)!==srd.stats[i]))return false;
 m.speed=Object.entries(srd.speed).filter(([k])=>k in modes).map(([k,v])=>`${modes[k]} ${clean(v)}`).join(', ')+(srd.speed.hover?' (парение)':'');
 m.senses=Object.entries(srd.senses).map(([k,v])=>`${senses[k]||k} ${clean(v)}`).join(', ');
 m.passivePerception=srd.senses.passive_perception;
 m.skills=srd.proficiencies.filter(p=>p.proficiency.index.startsWith('skill-')).map(p=>`${skillLabels[p.proficiency.index.slice(6)]||p.proficiency.name} ${p.value>=0?'+':''}${p.value}`).join(', ');
 m.saves=srd.proficiencies.filter(p=>p.proficiency.index.startsWith('saving-throw-')).map(p=>`${abilityLabels[p.proficiency.index.slice(13)]} +${p.value}`).join(', ');
 m.languages=languageText(srd.languages);m._srdVerified=true;
 const actionNames={Bite:'Укус',Claw:'Коготь',Claws:'Когти',Tail:'Хвост',Slam:'Удар',Multiattack:'Мультиатака',Fist:'Кулак',Shortsword:'Короткий меч',Longsword:'Длинный меч'};
 m._regularActionNames=(srd.regularActions||[]).map(n=>norm(actionNames[n]||n));return true;
}
function organize(monster){
 const m=structuredClone(monster),sections=['features','actions','bonus_actions','reactions','legendary_actions','lair_actions','regional_effects'];
 const entries=sections.flatMap(section=>(Array.isArray(m[section])?m[section]:[]).map(item=>({...item,section,name:clean(item.name),description:clean(item.description,true)})));
 const intro=entries.find(x=>/^легендарные действия$/i.test(x.name));
 const legendaryText=clean(intro?.description);m.legendaryCount=Number(legendaryText.match(/(?:совершить|совершает|использовать)\s+(\d+)\s+легендарн/i)?.[1])||null;
 const legendaryNames=new Map();
 if(intro)for(const e of entries){if(e===intro||e.name==='—'||e.name.length<3)continue;const name=e.name.replace(/\s*\([^)]*\)/g,'');const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=legendaryText.match(new RegExp('(?:^|[.!?]\\s+)'+escaped+'(?:\\s*\\(([^)]*)\\))?\\.','i'));if(match)legendaryNames.set(norm(e.name),Number(match[1]?.match(/\d+/)?.[0])||1);}
 for(const s of sections)m[s]=[];const seen=new Set();
 for(const e of entries){let section=e.section;
  if(/^легендарн(?:ая устойчивость|ое сопротивление)/i.test(e.name)){section='features';e.name=e.name.replace(/Легендарная устойчивость/i,'Легендарное сопротивление');}
  else if(/^логово\s*:|^действия логова/i.test(e.name))section='lair_actions';
  else if(/^эффекты местности|^местные эффекты|^региональные эффекты/i.test(e.name))section='regional_effects';
  else if(legendaryNames.has(norm(e.name))){
   if(e.section==='actions' && m._regularActionNames?.includes(norm(e.name)))m.actions.push({...e});
   section='legendary_actions';e.cost=legendaryNames.get(norm(e.name));
  }
  else if(section==='features' && /^(мультиатака|.*дыхание|(?:пугающее|ужасающее) присутствие)(?:\s|$)/i.test(e.name))section='actions';
  const key=section+'|'+norm(e.name)+( /^легендарное сопротивление/i.test(e.name)?'':'|'+norm(e.description));if(seen.has(key))continue;seen.add(key);
  if(e===intro){const cut=e.description.search(/(?:Обнаружение|Атака хвостом|Атака крыльями)\./);if(cut>=0)e.description=e.description.slice(0,cut).trim();}
  const {section:old,...item}=e;
  const recharge=item.description.match(/^\((перезарядка[^)]*|\d+\s*(?:в день|раз[^)]*|\/день))\)\s*/i);
  if(recharge && !item.name.includes('(')){item.name+=' ('+recharge[1]+')';item.description=item.description.slice(recharge[0].length);}
  if(srdKey(m)==='ancient white dragon' && section==='lair_actions')item.description=item.description.replace(/Существо, завершающее свой ход в этом тумане, получает [^.]+урона холодом\./,'');
  if(section==='legendary_actions'){item.cost ||= Number(item.name.match(/(?:стоит|стоимость|затрат[аы]|costs?)\s*(\d+)/i)?.[1])||null;item.name=item.name.replace(/^Легендарное действие:\s*/i,'');}
  m[section].push(item);
 }
 m.legendary_actions.sort((a,b)=>Number(/^легендарные действия$/i.test(b.name))-Number(/^легендарные действия$/i.test(a.name)));
 m.actions.sort((a,b)=>Number(/^мультиатака/i.test(b.name))-Number(/^мультиатака/i.test(a.name)));
 for(const key of ['skills','saves','speed','senses'])m[key]=typeof m[key]==='object'?m[key]:clean(m[key]);
 m.languages=languageText(m.languages);m.type=types[String(m.type).toLowerCase()]||clean(m.type);
 return m;
}
root.Bestiary={clean,esc,chips,list,organize,enrich,srdKey,languageText,skillLabels};if(typeof module!=='undefined'&&module.exports)module.exports=root.Bestiary;
})(typeof globalThis!=='undefined'?globalThis:window);
