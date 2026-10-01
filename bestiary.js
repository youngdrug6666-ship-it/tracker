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
const saveNames={str:'Силы',strength:'Силы',dex:'Ловкости',dexterity:'Ловкости',con:'Телосложения',constitution:'Телосложения',int:'Интеллекта',intelligence:'Интеллекта',wis:'Мудрости',wisdom:'Мудрости',cha:'Харизмы',charisma:'Харизмы'};
const damageNames={necrotic:'некротической энергией',piercing:'колющий',slashing:'рубящий',bludgeoning:'дробящий',cold:'холодом',fire:'огнём',poison:'ядом',acid:'кислотой',lightning:'электричеством',thunder:'звуком',force:'силовым полем',psychic:'психический',radiant:'излучением'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clean(value,paragraphs=false){
 if(value==null)return '';let s=String(value);
 for(let i=0;i<3;i++)s=s.replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#0*39;|&apos;/gi,"'").replace(/&nbsp;/gi,' ').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
 s=s.replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,'');
 s=s.replace(/(?:&|@)*(?:reference|eference)(?:\[[^\]]*\])?\{([^}]+)\}/gi,'$1');
 s=s.replace(/(?:&|@)reference\[([^\]]+)\]/gi,(_,x)=>({prone:'сбит с ног',frightened:'испуган',difficultterrain:'труднопроходимая местность',heavilyobscured:'сильно заслоняющая местность'}[x.toLowerCase()]||x));
 s=s.replace(/@(?:ActorEmbeddedItem|condition|spell|Item|Actor)\[[^\]]+\]\{([^}]+)\}/gi,'$1');
 s=s.replace(/@(?:UUID|Compendium)\[[^\]]+\]\{([^}]+)\}/gi,'$1').replace(/@(?:UUID|Compendium)\[[^\]]+\]/gi,'');
 s=s.replace(/(?:испытание|спасбросок)?\s*\[\[\/save\s+([^\]]+)\]\](?:\{([^}]*)\})?/gi,(_,args,label)=>{const ability=args.match(/(?:ability=)?(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)/i)?.[1]?.toLowerCase();const dc=Number(args.match(/dc=(\d+)/i)?.[1]||args.match(/\s(\d+)/)?.[1]||0)||Number(label?.match(/(?:Сл|DC)\s*(\d+)/i)?.[1]||0);return ' спасбросок '+(saveNames[ability]||label||'характеристики')+(dc>0?' Сл '+dc:'');});
 s=s.replace(/\[\[\/check\s+([^\]]+)\]\](?:\{([^}]*)\})?/gi,(_,args,label)=>{if(label)return label;const ability=args.match(/(?:ability=)?([a-z]+)/i)?.[1]?.toLowerCase(),dc=Number(args.match(/(?:dc=|\s)(\d+)/)?.[1]||0);return 'проверка '+(saveNames[ability]||'характеристики')+(dc>0?' Сл '+dc:'');});
 s=s.replace(/\[\[\/(?:r|roll|attack)\s+([^\]]+)\]\]\{([^}]+)\}/gi,'$2');
 s=s.replace(/\(\[\[\/damage\s+([^\]]+)\]\]\)\s+урона/gi,(_,v)=>{const type=v.match(/type=([a-z]+)/i)?.[1],formula=v.replace(/\s+type=\S+/g,'');return '('+formula+') урона'+(type?' ('+(damageNames[type]||type)+')':'');});
 s=s.replace(/\[\[\/(?:r|roll)\s+1d20\s*([+-]\s*\d+)\s*\]\]\s*\(\s*([+-]\d+)\s*\)/gi,(_,bonus,label)=>label);
 s=s.replace(/\[\[\/(?:r|roll)\s+([^\]]+)\]\]/gi,'$1').replace(/\[\[\/damage\s+([^\]]+)\]\]/gi,(_,v)=>{const type=v.match(/type=([a-z]+)/i)?.[1];return v.replace(/\s+type=\S+/g,'')+(type?' '+(damageNames[type]||type):'');});
 s=s.replace(/\[\[lookup[^\]]+\]\]/gi,'').replace(/\{@\w+\s+([^}|]+)(?:\|[^}]+)?\}/g,'$1');
 s=s.replace(/\b(?:DEC|PER|SLT|PRC|INV|ARC|ITM|ACR|ANI|ATH|HIS|INS|MED|NAT|REL|STE|SUR)\b/g,x=>skillLabels[codes[x.toLowerCase()]]||x);
 s=s.replace(/\b(?:STR|DEX|CON|INT|WIS|CHA)\b/gi,x=>abilityLabels[x.toLowerCase()]);
 s=s.replace(/\b(?:walk|fly|swim|burrow|climb|blindsight|darkvision|tremorsense|truesight|hover)\b/gi,x=>modes[x.toLowerCase()]||senses[x.toLowerCase()]||(x.toLowerCase()==='hover'?'парение':x));
 s=s.replace(/\bft\.?/gi,'фт.').replace(/Аркана/g,'Магия').replace(/Расследование/g,'Анализ').replace(/Внимание/g,'Восприятие').replace(/\bEro\b/g,'Его').replace(/Выносливость/g,'Телосложение').replace(/Выносливости/g,'Телосложения').replace(/Испытание\s*/g,'');
 s=s.replace(/\[\[\/(?:attack|skill|item|br)\s+([^\]]+)\]\](?:\{([^}]*)\})?/gi,(match,args,label)=>label||(/\[\[\/attack/i.test(match)?'бросок атаки':args.replace(/extended/gi,'')));
 s=s.replace(/\[\[[^\]]+\]\]\{([^}]+)\}/g,'$1');
 s=s.replace(/\[\[[^\]]+\]\]/g,'[значение требует расчёта]');
 const mechanical={acid:'кислота',bludgeoning:'дробящий',cold:'холод',fire:'огонь',force:'силовой',lightning:'электричество',necrotic:'некротический',piercing:'колющий',poison:'яд',psychic:'психический',radiant:'излучение',slashing:'рубящий',thunder:'звук',blinded:'ослеплённый',charmed:'очарованный',deafened:'оглохший',exhaustion:'истощение',frightened:'испуганный',grappled:'схваченный',incapacitated:'недееспособный',invisible:'невидимый',paralyzed:'парализованный',petrified:'окаменевший',poisoned:'отравленный',prone:'сбит с ног',restrained:'опутанный',stunned:'ошеломлённый',unconscious:'бессознательный',nonmagical:'немагический',magical:'магический',unarmed:'безоружный',melee:'ближний бой',ranged:'дальний бой'};
 s=s.replace(/\b(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder|blinded|charmed|deafened|exhaustion|frightened|grappled|incapacitated|invisible|paralyzed|petrified|poisoned|prone|restrained|stunned|unconscious|nonmagical|magical|unarmed|melee|ranged)\b/gi,x=>mechanical[x.toLowerCase()]);

 return (paragraphs?s.replace(/[^\S\n]+/g,' ').replace(/\n\s*\n+/g,'\n').trim():s.replace(/\s+/g,' ').trim());
}
const norm=s=>clean(s).toLowerCase().replace(/ё/g,'е').replace(/\s*\([^)]*\)/g,'').trim();
function list(value){if(Array.isArray(value))return value.map(v=>clean(v)).filter(Boolean);if(value&&typeof value==='object')return Object.entries(value).map(([k,v])=>`${modes[k]||senses[k]||k}: ${clean(v)}`);return clean(value).split(/\s*[,;]\s*/).filter(x=>x&&x!=='—');}
function chips(value){const parts=list(value);return parts.length?parts.map(x=>`<span class="bestiary-chip">${esc(x)}</span>`).join(''):'<span class="bestiary-empty">Не указано</span>';}
function languageText(value){return clean(value).replace(/all languages/gi,'все языки').replace(/understands/gi,'понимает').replace(/but (?:can.not|cannot) speak/gi,'но не может говорить').replace(/\b(common|draconic|dwarvish|elvish|giant|gnomish|goblin|halfling|orc|abyssal|celestial|infernal|primordial|sylvan|undercommon|deep_speech|deep speech|aquan|auran|ignan|terran|telepathy)\b/gi,x=>languages[x.toLowerCase().replace(' ','_')]||x);}
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
function applyStructure(m,source){
 if(!source || Number(m.cr)!==Number(source.cr) || Number(m.hp)!==source.hp || abilities.some((k,i)=>Number(m.stats?.[k]?.score)!==source.stats[i]))return false;
 m._sectionRules=source.rules;m._structureVerified=true;m._structureSource=source.source;m._sourceLegendaryCount=source.legendaryCount;
 m._regularActionNames=source.rules.filter(r=>r.section==='actions').map(r=>norm(r.name));
 m._sensesUnverified=false;m.senses=(source.senses||[]).map(clean).join(', ');m.passivePerception=source.passive;
 m.skills=Object.entries(source.skill||{}).map(([k,v])=>(skillLabels[k.replace(/ /g,'-')]||k)+' '+v).join(', ');
 m.saves=Object.entries(source.save||{}).map(([k,v])=>(abilityLabels[k]||k)+' '+v).join(', ');
 m.languages=languageText((source.languages||[]).join(', '));
 m.speed=Object.entries(source.speed||{}).filter(([k,v])=>k!=='canHover' && (typeof v==='number'||typeof v?.number==='number')).map(([k,v])=>(modes[k]||k)+' '+(typeof v==='number'?v:v.number)+' фт.'+(v?.condition?' '+clean(v.condition):'')).join(', ')+(source.speed?.canHover?' (парение)':'');
 return true;
}
function organize(monster){
 const m=structuredClone(monster);
 if(!m._foundryRaw && srdKey(m)==='vecna the archlich'){m.senses='Истинное зрение 120 фт., Пассивное восприятие 25';m._sensesUnverified=false;m.skills='Восприятие +15, История +14, Магия +22, Проницательность +15';m.damage_immunities='яд; дробящий, колющий и рубящий от немагических атак';}
 if(!m._foundryRaw && srdKey(m)==='strahd von zarovich'){m._regularActionNames=['безоружный удар','укус'];m.senses='Тёмное зрение 120 фт.';m._sensesUnverified=false;m.skills='Восприятие +12, Магия +15, Религия +10, Скрытность +14';m.languages='Общий, Бездны, Великанский, Драконий, Инфернальный, Эльфийский';}
 const sections=['features','actions','bonus_actions','reactions','legendary_actions','lair_actions','regional_effects'];
 const entries=sections.flatMap(section=>(Array.isArray(m[section])?m[section]:[]).map(item=>({...item,section,name:clean(item.name),_sourceDescription:item._sourceDescription??item.description,_displayDescription:item._displayDescription??item.description,description:clean(item.description,true)})));
 const intro=entries.find(x=>/^легендарные действия$/i.test(x.name));
 const legendaryText=clean(intro?.description);m.legendaryCount=Number(legendaryText.match(/(?:совершить|совершает|использовать)\s+(\d+)\s+легендарн/i)?.[1])||m._sourceLegendaryCount||null;
 const legendaryNames=new Map();
 if(intro)for(const e of entries){if(e===intro||e.name==='—'||e.name.length<3)continue;const name=e.name.replace(/\s*\([^)]*\)/g,'');const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=legendaryText.match(new RegExp('(?:^|[.!?]\\s+)'+escaped+'(?:\\s*\\(([^)]*)\\))?\\.','i'));if(match)legendaryNames.set(norm(e.name),Number(match[1]?.match(/\d+/)?.[0])||1);}
 for(const s of sections)m[s]=[];const seen=new Set();
 for(const e of entries){let section=e.section;
  const attack=/атака (?:оружием|заклинанием)|(?:рукопашная|дистанционная) атака/i.test(e.description);
  const rule=m._sectionRules?.find(r=>norm(r.name)===norm(e.name)&&r.attack===attack);
  if(rule){section=rule.section;e.cost=rule.cost||null;e.creatureRefs=rule.creatures||[];
   if(rule.spellAbility){const label={str:'Сила',dex:'Ловкость',con:'Телосложение',int:'Интеллект',wis:'Мудрость',cha:'Харизма'}[rule.spellAbility];
    for(const key of ['description','_displayDescription'])e[key]=String(e[key]||'').replace(/(используя\s+)(?:Интеллект|Мудрость|Харизму|Харизма|Ловкость|Силу)(\s+в качестве)/i,'$1'+(rule.spellAbility==='cha'?'Харизму':label)+'$2');
   }
  }
  else if(e._rawSection){section=e.section;}
  else
  if(/^легендарн(?:ая устойчивость|ое сопротивление)/i.test(e.name)){section='features';e.name=e.name.replace(/Легендарная устойчивость/i,'Легендарное сопротивление');}
  else if(/^логово\s*:|^действия логова/i.test(e.name))section='lair_actions';
  else if(/^эффекты местности|^местные эффекты|^региональные эффекты/i.test(e.name))section='regional_effects';
  else if(legendaryNames.has(norm(e.name)) && !(e.section==='actions' && m._regularActionNames?.includes(norm(e.name)))){
   if(e.section==='actions' && m._regularActionNames?.includes(norm(e.name)))m.actions.push({...e});
   section='legendary_actions';e.cost=legendaryNames.get(norm(e.name));
  }
  else if(srdKey(m)==='strahd von zarovich' && ['очарование','дети ночи'].includes(norm(e.name)))section='actions';
  else if(srdKey(m)==='vecna the archlich' && ['полет проклятых','гнилая судьба','заклинания'].includes(norm(e.name)))section='actions';
  else if(section==='features' && /^(мультиатака|.*дыхание|(?:пугающее|ужасающее) присутствие)(?:\s|$)/i.test(e.name))section='actions';
  if(/^легендарн(?:ая устойчивость|ое сопротивление)/i.test(e.name)){section='features';e.name=e.name.replace(/Легендарная устойчивость/i,'Легендарное сопротивление');}
  const key=section+'|'+norm(e.name)+( /^легендарное сопротивление/i.test(e.name)?'':'|'+norm(e.description));if(seen.has(key))continue;seen.add(key);
  if(e===intro){const cut=e.description.search(/(?:Обнаружение|Атака хвостом|Атака крыльями)\./);if(cut>=0)e.description=e.description.slice(0,cut).trim();}
  const {section:old,...item}=e;
  if(srdKey(m)==='vecna the archlich' && norm(item.name)==='полет проклятых' && !item.name.includes('('))item.name+=' (перезарядка 5–6)';
  const recharge=item.description.match(/^\((перезарядка[^)]*|\d+\s*(?:в день|раз[^)]*|\/день))\)\s*/i);
  if(recharge && !item.name.includes('(')){item.name+=' ('+recharge[1]+')';item.description=item.description.slice(recharge[0].length);item._displayDescription=String(item._displayDescription||'').replace(/^\((?:перезарядка[^)]*|\d+\s*(?:в день|раз[^)]*|\/день))\)\s*/i,'');}
  if(srdKey(m)==='ancient white dragon' && section==='lair_actions'){for(const field of ['description','_displayDescription'])item[field]=String(item[field]||'').replace(/Существо, завершающее свой ход в этом тумане, получает [^.]+урона холодом\./,'');}
  if(section==='legendary_actions'){item.cost ||= Number(item.name.match(/(?:стоит|стоимость|затрат[аы]|costs?)\s*(\d+)/i)?.[1])||null;item.name=item.name.replace(/^Легендарное действие:\s*/i,'');}
  m[section].push(item);
 }
 m.legendary_actions.sort((a,b)=>Number(/^легендарные действия$/i.test(b.name))-Number(/^легендарные действия$/i.test(a.name)));
 m.actions.sort((a,b)=>Number(/^мультиатака/i.test(b.name))-Number(/^мультиатака/i.test(a.name)));
 for(const key of ['skills','saves','speed','senses','damage_resistances','damage_immunities','condition_immunities'])m[key]=typeof m[key]==='object'?m[key]:clean(m[key]);
 m.languages=languageText(m.languages);m.type=types[String(m.type).toLowerCase()]||clean(m.type);
 return m;
}
function renderText(raw,options={}){
 const tokens=[];const protect=html=>{const marker='ZZBESTIARYTOKEN'+tokens.length+'ZZ';tokens.push(html);return marker;};
 let text=String(raw||'');
 text=text.replace(/@(?:UUID|Compendium)\[([^\]]+)\](?:\{([^}]+)\})?/gi,(all,id,label)=>{
  const name=label||options.resolveUuid?.(id)||'';
  const monster=/actors|monsters|bestiary/i.test(id)?options.findMonster?.(id,name):null;
  if(monster)return protect(options.monsterLink(monster,name||monster.name.split('/')[0]));
  const spell=!/actors|monsters|bestiary/i.test(id) ? options.findSpell?.(id,name) : null;
  return spell?protect(`<span class="spell-link" data-spell="${esc(spell.spellName)}">${esc(name||spell.spellName.split('/')[0])}</span>`):name;
 });
 for(const ref of options.creatureRefs||[]){
  const monster=options.findMonster?.('',ref);if(!monster)continue;
  const candidates=options.monsterAliases?.(monster)||[monster.name.split('/')[0].trim()];
  for(const label of candidates.sort((a,b)=>b.length-a.length)){
   const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   text=text.replace(new RegExp('(^|[^а-яёa-z])('+escaped+')(?=$|[^а-яёa-z])','gi'),(_,before,found)=>before+protect(options.monsterLink(monster,found)));
  }
 }
 text=text.replace(/\[\[\/(?:r|roll|attack)\s+([^\]]+)\]\]\{([^}]+)\}/gi,(_,formula,label)=>protect(`<span class="dice-formula-link" data-formula="${esc(formula)}">${esc(label)}</span>`));
 text=text.replace(/\[\[\/(?:r|roll)\s+(1d20\s*([+-]\s*\d+))\s*\]\]\s*\(\s*([+-]\d+)\s*\)/gi,(_,formula,bonus,label)=>protect(`<span class="dice-formula-link" data-formula="${esc(formula)}">${esc(label)}</span>`));
 let html=esc(clean(text,true));
 html=html.replace(/(?:спасбросок\s+)?(Силы|Ловкости|Телосложения|Интеллекта|Мудрости|Харизмы)\s+(?:со\s+)?(?:СЛ|Сл)\s*(\d+)/g,(_,ability,dc)=>`<strong class="bestiary-save">Спасбросок ${ability} · Сл ${dc}</strong>`);
 // Dice remain interactive; spell links are created only from explicit references.
 if(options.wrapDice)html=options.wrapDice(html);
 for(let i=0;i<tokens.length;i++)html=html.replace('ZZBESTIARYTOKEN'+i+'ZZ',tokens[i]);
 return html.replace(/\n+/g,'<br>');
}
root.Bestiary={applyStructure,renderText,clean,esc,chips,list,organize,enrich,srdKey,languageText,skillLabels};if(typeof module!=='undefined'&&module.exports)module.exports=root.Bestiary;
})(typeof globalThis!=='undefined'?globalThis:window);
