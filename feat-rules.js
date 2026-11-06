(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const abilities={str:'СИЛ',dex:'ЛОВ',con:'ТЕЛ',int:'ИНТ',wis:'МДР',cha:'ХАР'};
const rows=`101-actor|Артистичный|Подражание голосу и образу другого человека.|cha
102-athlete|Атлетичный|Более удобные прыжки, лазание и подъём из положения лёжа.|str,dex
103-alert|Бдительный|Быстрая реакция на опасность; защита от неожиданного нападения в сознании.
104-war-caster|Боевой заклинатель|Удержание концентрации, жесты с занятыми руками и заклинание вместо провоцированной атаки.
105-grappler|Борец|Преимущества в борьбе с захваченным противником.
106-lucky|Везунчик|Ограниченный запас удачи для изменения результата бросков.
107-mounted-combatant|Верховой боец|Преимущества в седле и защита скакуна.
108-observant|Внимательный|Чтение по губам и усиление пассивных проверок наблюдения.|int,wis
109-martial-adept|Воинский адепт|Боевые приёмы и ограниченный запас кости превосходства.
110-inspiring-leader|Воодушевляющий лидер|Речь для группы, предоставляющая временные хиты.
111-savage-attacker|Дикий атакующий|Возможность улучшить бросок урона рукопашным оружием.
112-tavern-brawler|Драчун|Импровизированное оружие, безоружные удары и захват после попадания.|str,con
113-lightly-armored|Знаток лёгких доспехов|Обучение ношению лёгких доспехов.|str,dex
114-moderately-armored|Знаток средних доспехов|Обучение средним доспехам и щитам.|str,dex
115-heavily-armored|Знаток тяжёлых доспехов|Обучение тяжёлым доспехам.|str
116-dual-wielder|Использование двух оружий|Расширяет возможности боя двумя оружиями; бонус КД действует при выполнении условия.
117-dungeon-delver|Исследователь подземелий|Обнаружение тайников и защита от ловушек.
118-tough|Крепкий|Максимум хитов растёт дополнительно с каждым уровнем.
119-healer|Лекарь|Расширенные возможности лечения набором целителя.
120-great-weapon-master|Мастер большого оружия|Дополнительные атаки при определённых попаданиях и обмен точности на урон тяжёлым оружием.
121-polearm-master|Мастер древкового оружия|Дополнительный удар древком и новые условия провоцированной атаки.
122-weapon-master|Мастер оружия|Обучение выбранным видам оружия.|str,dex
123-medium-armor-master|Мастер средних доспехов|Улучшает использование Ловкости и скрытность в средних доспехах.
124-heavy-armor-master|Мастер тяжёлых доспехов|Снижает определённый немагический физический урон в тяжёлых доспехах.|str
125-shield-master|Мастер щитов|Толчок щитом и дополнительные способы защиты от эффектов по Ловкости.
126-spell-sniper|Меткие заклинания|Улучшает дальние атаки заклинаниями и предоставляет заговор.
127-sharpshooter|Меткий стрелок|Стрельба на дистанции, игнорирование части укрытий и обмен точности на урон.
128-charger|Налётчик|Атака или толчок после разгона и Рывка.
129-defensive-duelist|Оборонительный дуэлянт|Реакция для повышения КД против одной рукопашной атаки при подходящем оружии.
130-skilled|Одарённый|Дополнительные владения навыками или инструментами.
131-keen-mind|Отличная память|Ориентация, чувство времени и точное запоминание недавних событий.|int
132-mobile|Подвижный|Повышает скорость и помогает перемещаться среди противников.
133-magic-initiate|Посвящённый в магию|Выбранные заговоры и заклинание из списка одного класса.
134-skulker|Проныра|Улучшает скрытность при слабом освещении и после промаха из укрытия.
135-ritual-caster|Ритуальный заклинатель|Книга ритуалов и возможность расширять её содержание.
136-elemental-adept|Стихийный адепт|Усиливает заклинания выбранного типа урона против сопротивления.
137-durable|Стойкий|Повышает нижнюю границу восстановления от костей хитов.|con
138-sentinel|Страж|Останавливает врагов провоцированными атаками и защищает соседних союзников.
139-mage-slayer|Убийца магов|Преимущества против заклинателей на близкой дистанции.
140-resilient|Устойчивый|Повышение характеристики и владение соответствующим спасброском.|str,dex,con,int,wis,cha
141-crossbow-expert|Эксперт в арбалетах|Улучшает обращение с арбалетом и стрельбу вблизи врага.
142-linguist|Языковед|Дополнительные языки и создание шифров.|int
218-rune-shaper|Ваятель рун|Руническая магия и связанные с рунами заклинания.
213-soul-of-the-storm-giant|Душа штормового великана|Защитная сила штормового великана и особая аура.|str,wis,cha
215-guile-of-the-cloud-giant|Коварство облачного великана|Уловка облачного великана для защиты и перемещения.|str,con,cha
216-fury-of-the-frost-giant|Неистовство ледяного великана|Ледяная защита и ответная сила холода.|str,con,wis
217-embar-of-the-fire-giant|Пылкость огненного великана|Огненная защита и боевой всплеск пламени.|str,con,int
220-vigor-of-the-hill-giant|Стойкость холмового великана|Укрепляет живучесть и устойчивость к сбиванию с ног.|str,con,wis
234-strike-of-the-giants|Удар великанов|Ограниченные усиления оружейных попаданий выбранной силой великана.
221-keenness-of-the-stone-giant|Чуткость каменного великана|Сила каменного великана для особых чувств и боевых приёмов.|str,con,wis
224-cartomancer|Картомант|Карточные фокусы и сохранение магии в карте.
173-aberrant-dragonmark|Искажённая метка дракона|Магическая метка с заклинаниями и особыми эффектами.|con
174-revenant-blade|Призрачный клинок|Особые преимущества при использовании двустороннего скимитара.|str,dex
175-gift-of-metallic-dragon|Дар металлического дракона|Целительная магия и защитная реакция драконьих крыльев.
176-gift-of-gem-dragon|Дар самоцветного дракона|Ответный телекинетический удар.|int,wis,cha
177-gift-of-chromatic-dragon|Дар цветного дракона|Стихийное усиление оружия и реактивная защита.
222-agent-of-order|Агент Порядка|Сила Порядка для усиления попадания и ограничения врага.|str,dex,con,int,wis,cha
223-baleful-scion|Зловещий наследник|Дополнительная зловещая сила попадания и восстановление.|str,dex,con,int,wis,cha
225-cohort-of-chaos|Когорта Хаоса|Непредсказуемые магические эффекты Хаоса.|str,dex,con,int,wis,cha
233-scion-of-the-outer-planes|Наследник внешних планов|Планарное происхождение с выбранным магическим даром и защитой.
227-planar-wanderer|Планарный странник|Преимущества для путешествий между планами.
226-outlands-envoy|Посол Внешних земель|Магические возможности посланника Внешних земель.|str,dex,con,int,wis,cha
228-righteous-heritor|Праведный наследник|Защитная сила праведного планарного наследия.|str,dex,con,int,wis,cha
178-svirfneblin-magic|Магия свирфнеблинов|Дополнительная магия глубинных гномов.
158-metamagic-adept|Адепт метамагии|Приёмы метамагии и небольшой запас единиц чародейства.
159-eldritch-adept|Адепт таинств|Выбор доступного таинственного воззвания.
160-shadow-touched|Затронутый тенью|Теневая магия с дополнительными заклинаниями.|int,wis,cha
161-fey-touched|Затронутый феями|Фейская магия перемещения и дополнительное заклинание.|int,wis,cha
162-gunner|Знаток огнестрельного оружия|Владение огнестрельным оружием и стрельба рядом с врагом.|dex
163-crusher|Крушитель|Перемещение цели дробящего удара и преимущества после критического попадания.|str,con
164-poisoner|Отравитель|Изготовление яда и улучшенное применение отравленного оружия.
165-fighting-initiate|Посвящённый в боевое искусство|Один доступный боевой стиль.
166-artificer-initiate|Посвящённый в изобретательство|Магия изобретателя и владение выбранными инструментами.
167-piercer|Пронзатель|Улучшает броски колющего урона и критические попадания.|str,dex
168-slasher|Рубака|Замедляет цель рубящего удара и ослабляет её после критического попадания.|str,dex
169-telekinetic|Телекинетик|Невидимая магическая рука и телекинетический толчок.|int,wis,cha
170-telepathic|Телепат|Телепатическая речь и чтение мыслей.|int,wis,cha
171-chef|Шеф-повар|Приготовление пищи для восстановления и временных хитов.|con,wis
172-skill-expert|Эксперт в навыке|Дополнительный навык и компетентность в выбранном навыке.|str,dex,con,int,wis,cha
143-bountiful-luck|Бездонная удача|Помощь союзникам с неудачными бросками.
144-second-chance|Второй шанс|Защитный переброс вражеской атаки.|dex,con,cha
145-prodigy|Вундеркинд|Дополнительные владения и компетентность.
146-drow-high-magic|Высшая магия дроу|Дополнительные заклинания дроу.
147-dwarven-fortitude|Дварфийская стойкость|Восстановление костями хитов при Уклонении в бою.|con
148-dragon-fear|Драконий страх|Драконье дыхание можно использовать для устрашения.|str,con,cha
149-dragon-hide|Драконья шкура|Естественная броня и когти драконьего потомка.|str,con,cha
150-infernal-constitution|Инфернальное телосложение|Укрепляет защиту от холода, яда и отравления.|con
151-fade-away|Исчезновение|Кратковременное исчезновение после получения урона.|dex,int
152-wood-elf-magic|Магия лесных эльфов|Лесная магия с дополнительными заклинаниями.
153-squat-nimbleness|Низкорослое проворство|Увеличивает скорость и помогает выбраться из захвата.|str,dex
154-orcish-fury|Орочье буйство|Дополнительная сила оружейного удара и ответная атака.|str,con
155-flames-of-phlegethos|Пламя Флегетоса|Усиливает огненную магию и создаёт защитное пламя.|int,cha
156-fey-teleportation|Телепортация фей|Фейская телепортация и языковые знания.|int,cha
157-elven-accuracy|Эльфийская точность|Повышает надёжность определённых атак с преимуществом.|dex,int,wis,cha
251-adept-of-the-white-robes|Адепт Белых одежд|Защитная магия традиции Белых одежд.
250-adept-of-the-red-robes|Адепт Красных одежд|Магия равновесия и надёжность бросков.
249-adept-of-the-black-robes|Адепт Чёрных одежд|Разрушительная магия традиции Чёрных одежд.
247-divinely-favored|Любимец богов|Божественные заклинания и магическое покровительство.
252-squire-of-solamnia|Оруженосец рыцаря Соламнии|Боевые приёмы и обучение верховой езде.
248-initiate-of-high-sorcery|Посвящённый в Высшее волшебство|Начальное обучение магии Высшего волшебства.
253-knight-of-the-crown|Рыцарь Короны|Поддержка союзников в совместном бою.|str,dex,con
255-knight-of-the-sword|Рыцарь Меча|Воодушевление и стойкость перед страхом.|int,wis,cha
254-knight-of-the-rose|Рыцарь Розы|Укрепление союзников временными хитами.|con,wis,cha
179-strixhaven-initiate|Поступивший в Стриксхейвен|Начальные заклинания выбранного колледжа.
180-strixhaven-mascot|Талисман Стриксхейвена|Особый фамильяр колледжа и взаимодействие с ним.`;
const catalog=rows.split('\n').map(line=>{const [id,name,description,options]=line.split('|');return{id,name,description,options:options?.split(',')||[],url:'https://dnd.su/feats/'+id+'/'};});
const presets={'103-alert':{initiative:5},'108-observant':{passive:5},'118-tough':{hpPerLevel:2},'132-mobile':{speed:10},'153-squat-nimbleness':{speed:5}};
const fields={initiative:'Инициатива',speed:'Скорость (фт)',hp:'Макс. ХП',hpPerLevel:'ХП за уровень',ac:'КД',passive:'Пасс. восприятие',spellAttack:'Атака закл.',spellDC:'СЛ закл.',saveBonus:'Все спасброски'};
function list(c){return Array.isArray(c.feats)?c.feats:[];}
function has(c,id){return list(c).some(f=>f.id===id&&f.enabled!==false&&!f.included);}
function total(c,key){return list(c).reduce((n,f)=>n+(f.enabled!==false&&!f.included?num(f.effects?.[key]):0),0);}
function abilityBonus(c,key){return list(c).reduce((n,f)=>n+(f.enabled!==false&&!f.included&&f.ability===key?1:0),0);}
function level(c){return Math.max(1,Math.floor(num(c.featLevel||c.heroData?.info?.level?.value||c.level||String(c.hpFormula||'').match(/^(\d+)d/i)?.[1])||1));}
function before(c){const a=c._featApplied;if(!a)return;for(const [key,value]of Object.entries(a.fields||{}))c[key]=num(c[key])-value;for(const [key,value]of Object.entries(a.stats||{})){if(c.stats?.[key]){c.stats[key].score=num(c.stats[key].score)-value;c.stats[key].mod=Math.floor((c.stats[key].score-10)/2);}}delete c._featApplied;}
function apply(c,recalculate){
 before(c);const applied={fields:{},stats:{}};let conDelta=0,dexDelta=0;
 for(const key of Object.keys(abilities)){const value=abilityBonus(c,key),stat=c.stats?.[key];if(!value||!stat)continue;const old=Math.floor((num(stat.score)-10)/2),delta=Math.max(0,Math.min(20,num(stat.score)+value)-num(stat.score));if(!delta)continue;stat.score=num(stat.score)+delta;stat.mod=Math.floor((stat.score-10)/2);applied.stats[key]=delta;if(key==='con')conDelta=stat.mod-old;if(key==='dex')dexDelta=stat.mod-old;}
 if(recalculate)recalculate(c);
 const changes={initBonus:total(c,'initiative')+(c.isMonster?dexDelta:0),speed:total(c,'speed'),ac:total(c,'ac'),maxHp:total(c,'hp')+(total(c,'hpPerLevel')+conDelta)*level(c),spellAttack:total(c,'spellAttack'),spellSaveDC:total(c,'spellDC')};
 for(const [key,value]of Object.entries(changes)){if(!value)continue;const previous=num(c[key]);c[key]=key==='maxHp'?Math.max(1,previous+value):previous+value;applied.fields[key]=c[key]-previous;}
 c._featApplied=applied;if(Number.isFinite(c.currentHp)&&c.currentHp>c.maxHp)c.currentHp=c.maxHp;
}
function saveProficient(c,key){return list(c).some(f=>f.id==='140-resilient'&&f.enabled!==false&&!f.included&&f.ability===key);}
function resistances(c){const map={'150-infernal-constitution':['холод','яд'],'216-fury-of-the-frost-giant':['холод'],'217-embar-of-the-fire-giant':['огонь']};return [...new Set(list(c).filter(f=>f.enabled!==false&&!f.included).flatMap(f=>map[f.id]||[]))];}
function panel(c){return `<section class="tracker-feats"><header><div><h3>✦ Черты</h3><p>Правила 2014 · краткие описания и ссылки на DnD.su</p></div><span>${list(c).length}</span></header><div class="feat-add"><input class="feat-search" placeholder="Найти черту…" aria-label="Поиск черты"><select class="feat-catalog" aria-label="Выбрать черту">${catalog.filter(f=>!list(c).some(x=>x.id===f.id)).map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')}</select><button type="button" class="feat-add-btn">+ Добавить</button></div><p class="feat-help">Постоянные числовые бонусы применяются автоматически. Условные действия, заклинания и перебросы используйте по описанию. Если бонус уже есть в LSS, отметьте «Учтено в листе».</p><label class="feat-level">Уровень / кости хитов для бонусов ХП <input class="feat-level-input" type="number" min="1" max="100" value="${level(c)}"></label><div class="feat-owned">${list(c).map((f,i)=>{const meta=catalog.find(x=>x.id===f.id);const summary=Object.entries(f.effects||{}).filter(([,v])=>num(v)!==0).map(([k,v])=>(fields[k]||k)+' '+(num(v)>0?'+':'')+num(v)).join(' · ');return `<article class="feat-entry"><div class="feat-entry-head"><label><input class="feat-enabled" data-index="${i}" type="checkbox" ${f.enabled!==false?'checked':''}><b>${esc(f.name)}</b></label><button type="button" class="feat-remove" data-index="${i}" aria-label="Удалить черту ${esc(f.name)}">×</button></div><p>${esc(f.description||meta?.description||'')}</p>${summary?`<div class="feat-effect-summary">${esc(summary)}${f.included?' · уже в листе':f.enabled===false?' · выключено':' · автоматически'}</div>`:''}${meta?`<a href="${meta.url}" target="_blank" rel="noopener noreferrer">Полное описание на DnD.su ↗</a>`:''}${meta?.options.length?`<label class="feat-ability-label">+1 к характеристике <select class="feat-ability" data-index="${i}"><option value="">Выберите</option>${meta.options.map(k=>`<option value="${k}" ${f.ability===k?'selected':''}>${abilities[k]}</option>`).join('')}</select></label>`:''}<label class="feat-included-label"><input type="checkbox" class="feat-included" data-index="${i}" ${f.included?'checked':''}> Бонусы уже учтены в листе</label><details><summary>Числовые эффекты${Object.entries(f.effects||{}).some(([,v])=>v)?' · настроены':''}</summary><p class="feat-help">Условный бонус включайте только пока выполнено условие. Поля содержат добавку к текущим значениям.</p><div class="feat-effects">${Object.entries(fields).map(([key,label])=>`<label>${label}<input class="feat-effect" data-index="${i}" data-key="${key}" type="number" min="-100" max="100" step="1" value="${num(f.effects?.[key])}"></label>`).join('')}</div><label>Описание / заметка<textarea class="feat-description" data-index="${i}" maxlength="3000">${esc(f.description||meta?.description||'')}</textarea></label></details></article>`;}).join('')||'<p class="feat-empty">Черты ещё не добавлены.</p>'}</div></section>`;}
function bind(container,c,changed){
 const section=container.querySelector('.tracker-feats');if(!section)return;
 const select=section.querySelector('.feat-catalog');section.querySelector('.feat-search').oninput=e=>{const q=e.target.value.toLocaleLowerCase('ru').replace(/ё/g,'е');select.innerHTML=catalog.filter(f=>!list(c).some(x=>x.id===f.id)&&f.name.toLocaleLowerCase('ru').replace(/ё/g,'е').includes(q)).map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('');section.querySelector('.feat-add-btn').disabled=!select.options.length;};
 section.querySelector('.feat-add-btn').onclick=()=>{const meta=catalog.find(f=>f.id===select.value);if(!meta||list(c).some(f=>f.id===meta.id))return;before(c);c.feats||=[];c.feats.push({id:meta.id,name:meta.name,description:meta.description,enabled:true,included:false,ability:meta.options.length===1?meta.options[0]:'',effects:{...(presets[meta.id]||{})}});changed();};
 section.addEventListener('click',e=>{const b=e.target.closest('.feat-remove');if(!b)return;before(c);c.feats.splice(Number(b.dataset.index),1);changed();});
 section.addEventListener('change',e=>{const el=e.target;if(!el.matches('.feat-enabled,.feat-included,.feat-ability,.feat-effect,.feat-description,.feat-level-input'))return;before(c);if(el.matches('.feat-level-input'))c.featLevel=Math.max(1,Math.min(100,Math.floor(num(el.value)||1)));else{const f=list(c)[Number(el.dataset.index)];if(!f)return;if(el.matches('.feat-enabled'))f.enabled=el.checked;else if(el.matches('.feat-included'))f.included=el.checked;else if(el.matches('.feat-ability'))f.ability=el.value;else if(el.matches('.feat-description'))f.description=el.value.slice(0,3000);else (f.effects||={})[el.dataset.key]=Math.max(-100,Math.min(100,Math.trunc(num(el.value))));}changed();});
}
const api={catalog,total,abilityBonus,level,before,apply,saveProficient,resistances,has,panel,bind};root.FeatRules=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);

