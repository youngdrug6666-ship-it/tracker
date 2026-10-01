(function (root) {
    'use strict';
    const abilities = {str:'СИЛ',dex:'ЛОВ',con:'ТЕЛ',int:'ИНТ',wis:'МДР',cha:'ХАР'};
    const skills = {
        acrobatics:['Акробатика','dex'], investigation:['Анализ','int'], athletics:['Атлетика','str'],
        perception:['Восприятие','wis'], survival:['Выживание','wis'], performance:['Выступление','cha'],
        intimidation:['Запугивание','cha'], history:['История','int'], 'sleight of hand':['Ловкость рук','dex'],
        arcana:['Магия','int'], medicine:['Медицина','wis'], deception:['Обман','cha'], nature:['Природа','int'],
        insight:['Проницательность','wis'], religion:['Религия','int'], stealth:['Скрытность','dex'],
        persuasion:['Убеждение','cha'], 'animal handling':['Уход за животными','wis']
    };
    const num = (v, fallback=0) => {
        v = v?.value ?? v;
        if (v === '' || v == null) return fallback;
        return Number.isFinite(Number(v)) ? Number(v) : fallback;
    };
    const mod = score => Math.floor((score-10)/2);
    const signed = n => (n >= 0 ? '+' : '') + n;
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function ensure(hero) {
        hero.stats ||= {};
        hero.heroData ||= {};
        for (const key of Object.keys(abilities)) {
            hero.stats[key] ||= {score:10};
            hero.stats[key].mod = mod(num(hero.stats[key].score,10));
        }
        const d = hero.heroData;
        d.skills ||= {}; d.saves ||= {};
        for (const [key,[label,baseStat]] of Object.entries(skills)) d.skills[key] ||= {label,baseStat,isProf:false};
        for (const key of Object.keys(abilities)) d.saves[key] ||= {isProf:false};
        if (!hero.heroControls) {
            const prof = num(hero.proficiency ?? d.proficiency,2);
            const value = d.spellsInfo?.base;
            const byName = {'мудрость':'wis','харизма':'cha','интеллект':'int'};
            const candidate = String(value?.code || byName[String(value?.value || '').toLowerCase()] || 'cha').toLowerCase();
            const spellAbility = candidate in abilities ? candidate : 'cha';
            const expectedAttack = prof + (hero.stats[spellAbility]?.mod ?? 0);
            let dc = num(hero.spellSaveDC,8+expectedAttack), attack = num(hero.spellAttack,expectedAttack);
            const swapped = dc === expectedAttack && attack === 8+expectedAttack;
            if (swapped) [dc,attack] = [attack,dc];
            hero.heroControls = {
                baseAc:num(hero.ac,10) - (d.vitality?.shield?.value === true ? 2 : 0),
                shield:d.vitality?.shield?.value === true, items:[], proficiency:prof, saveBonus:0,
                spellAbility, spellDcExtra:dc-8-expectedAttack, spellAttackExtra:attack-expectedAttack,
                initiativeExtra:num(hero.initBonus)-hero.stats.dex.mod, swappedSpellFields:swapped,
                weapons:(d.weaponsList || []).filter(w=>w.name?.value).map(w=>{
                    const ability = w.ability in abilities ? w.ability : '';
                    const originalMod = ability ? hero.stats[ability].mod : 0;
                    const trained = w.isProf === true || w.isProf === 1;
                    return {name:w.name.value, ability, proficient:trained,
                        attackExtra:num(w.mod)-originalMod-(trained?prof:0),
                        damage:String(w.dmg?.value || ''), originalMod};
                })
            };
            hero.spellSlots ||= {};
            for (const [prefix,source] of [['',d.spells],['pact-',d.spellsPact]]) {
                for (const [key,v] of Object.entries(source || {})) if (/^slots-\d+$/.test(key)) {
                    const level=key.slice(6), max=Math.max(0,num(v));
                    if (max && !hero.spellSlots[prefix+level]) hero.spellSlots[prefix+level]={max,used:0};
                }
            }
        }
        recalculate(hero);
        return hero;
    }
    function recalculate(hero) {
        const h=hero.heroControls;
        if (!h) return;
        for (const key of Object.keys(abilities)) hero.stats[key].mod=mod(num(hero.stats[key].score,10));
        hero.proficiency=h.proficiency;
        hero.initBonus=hero.stats.dex.mod+h.initiativeExtra;
        hero.ac=h.baseAc+(h.shield?2:0)+h.items.reduce((sum,i)=>sum+(i.enabled?num(i.bonus):0),0);
        const attack=h.proficiency+hero.stats[h.spellAbility].mod;
        hero.spellAttack=attack+h.spellAttackExtra; hero.spellSaveDC=8+attack+h.spellDcExtra;
    }
    function weaponAttack(hero,w) {
        return w.attackExtra+(w.ability?hero.stats[w.ability].mod:0)+(w.proficient?hero.proficiency:0);
    }
    function weaponDamage(hero,w) {
        if (!w.ability) return w.damage;
        const current=hero.stats[w.ability].mod;
        return w.damage.replace(/([+−-])\s*(\d+)/,(_,sign,n)=>signed((sign==='+'?Number(n):-Number(n))-w.originalMod+current));
    }
    function statInputs(hero) {
        return `<div class="hero-stats">${Object.entries(abilities).map(([key,label])=>`<label>${label}<input class="hero-score" data-key="${key}" type="number" min="1" max="30" value="${hero.stats[key].score}" aria-label="${label}"><b>${signed(hero.stats[key].mod)}</b></label>`).join('')}</div>`;
    }
    function panel(hero,richText) {
        const h=hero.heroControls,d=hero.heroData;
        const saves=Object.entries(abilities).map(([key,label])=>`<tr><td>${label}</td><td><input class="hero-save-prof" data-key="${key}" type="checkbox" ${d.saves[key].isProf?'checked':''} aria-label="Владение спасброском ${label}"></td><td>${signed(hero.stats[key].mod+(d.saves[key].isProf?hero.proficiency:0)+num(h.saveBonus))}</td></tr>`).join('');
        const skillRows=Object.entries(d.skills).map(([key,v])=>{
            const base=v.baseStat in abilities?v.baseStat:(skills[key]?.[1]||'wis');
            const rank=v.isProf===2?2:v.isProf?1:0;
            return `<tr><td>${esc(v.label||skills[key]?.[0]||key)}</td><td><select class="hero-skill-prof" data-key="${esc(key)}" aria-label="Владение ${esc(v.label||key)}">${['—','Влад.','Комп.'].map((label,i)=>`<option value="${i}" ${rank===i?'selected':''}>${label}</option>`).join('')}</select></td><td>${signed(hero.stats[base].mod+rank*hero.proficiency)}</td></tr>`;
        }).join('');
        const weapons=h.weapons.map((w,i)=>`<div class="hero-weapon"><b>${esc(w.name)}</b> ${signed(weaponAttack(hero,w))} · ${esc(weaponDamage(hero,w))}<div><select class="hero-weapon-ability" data-index="${i}" aria-label="Характеристика оружия"><option value="">Ручной бонус</option>${Object.entries(abilities).map(([key,label])=>`<option value="${key}" ${w.ability===key?'selected':''}>${label}</option>`).join('')}</select><label><input class="hero-weapon-prof" data-index="${i}" type="checkbox" ${w.proficient?'checked':''}> Владение</label><label>Доп. атака <input class="hero-weapon-extra" data-index="${i}" type="number" value="${w.attackExtra}"></label></div></div>`).join('');
        return `<div class="hero-quick"><button class="hero-inspiration ${hero.inspiration?'equipped':''}" aria-pressed="${!!hero.inspiration}">✦ Вдохновение ${hero.inspiration?'выдано':'нет'}</button><button class="hero-shield ${h.shield?'equipped':''}" aria-pressed="${h.shield}">🛡 Щит ${h.shield?'в руках':'убран'} (+2)</button><label>Скорость <input class="hero-speed" type="number" min="0" value="${num(hero.speed,30)}"> фт</label></div>
        <details class="hero-sheet" ${hero.heroPanelOpen?'open':''}><summary>Навыки, спасброски и снаряжение</summary>
        <div class="hero-options"><label>Бонус владения <input class="hero-proficiency" type="number" min="0" max="12" value="${hero.proficiency}"></label><label>Доп. ко всем спасброскам <input class="hero-save-bonus" type="number" value="${num(h.saveBonus)}"></label><label>КД без щита и предметов <input class="hero-base-ac" type="number" value="${h.baseAc}"></label></div>
        <div class="hero-tables"><table><caption>Спасброски</caption><tbody>${saves}</tbody></table><table><caption>Все навыки</caption><tbody>${skillRows}</tbody></table></div>
        <details><summary>Владения</summary>${richText(d.text?.prof ?? d.prof)||'Не заполнены'}</details>
        <details><summary>Оружие</summary>${weapons||'Нет оружия в листе'}</details>
        <details><summary>Заклинания: настройки</summary><label>Характеристика <select class="hero-spell-ability">${Object.entries(abilities).map(([key,label])=>`<option value="${key}" ${key===h.spellAbility?'selected':''}>${label}</option>`).join('')}</select></label><label>Доп. Сл <input class="hero-spell-dc-extra" type="number" value="${h.spellDcExtra}"></label><label>Доп. атака <input class="hero-spell-attack-extra" type="number" value="${h.spellAttackExtra}"></label>${h.swappedSpellFields?'<p>В исходном LSS Сл и атака были переставлены: применены значения по характеристике и владению.</p>':''}</details>
        <details><summary>Предметы с бонусом КД</summary>${h.items.map((item,i)=>`<div class="hero-item"><input class="hero-item-enabled" data-index="${i}" type="checkbox" ${item.enabled?'checked':''} aria-label="Использовать предмет"><input class="hero-item-name" data-index="${i}" value="${esc(item.name)}" aria-label="Название предмета"><input class="hero-item-bonus" data-index="${i}" type="number" value="${num(item.bonus)}" aria-label="Бонус КД"><button class="hero-item-remove" data-index="${i}" aria-label="Удалить предмет">×</button></div>`).join('')}<button class="hero-item-add">+ Предмет с бонусом КД</button><p>Бонусы складываются; применимость предметов определяет мастер.</p></details></details>`;
    }
    function quick(hero) {
        return `<div class="hero-quick hero-quick-compact"><button class="hero-inspiration ${hero.inspiration?'equipped':''}" aria-pressed="${!!hero.inspiration}" title="Выдать или потратить вдохновение">✦ Вдохновение</button><button class="hero-shield ${hero.heroControls.shield?'equipped':''}" aria-pressed="${hero.heroControls.shield}" title="Взять или убрать щит">🛡 Щит</button></div>`;
    }
    function summaryStats(hero) {
        return `<div class="hero-stat-summary">${Object.entries(abilities).map(([key,label])=>`<div><span>${label}</span><b>${hero.stats[key].score} (${signed(hero.stats[key].mod)})</b></div>`).join('')}</div>`;
    }
    function slots(hero) {
        return `<section class="hero-modal-section"><h3>Ячейки заклинаний</h3><div class="hero-modal-slots">${Object.entries(hero.spellSlots || {}).map(([key,slot])=>`<div class="hero-modal-slot"><span>${key.startsWith('pact-')?'Договор '+key.slice(5):key+' уровень'}</span><b>${slot.max-(slot.used||0)} / ${slot.max}</b><button class="hero-detail-use-slot" data-level="${esc(key)}" title="Потратить ячейку">−</button><button class="hero-detail-restore-slot" data-level="${esc(key)}" title="Восстановить ячейку">+</button><label>Всего <input class="hero-detail-slot-max" data-level="${esc(key)}" type="number" min="0" value="${slot.max}"></label></div>`).join('') || '<p>Нет ячеек в листе</p>'}</div></section>`;
    }
    function details(hero,richText) {
        let content=panel(hero,richText);
        content=content.slice(content.indexOf('<details class="hero-sheet"'));
        content=content.replace(/<details class="hero-sheet"[^>]*><summary>[^<]*<\/summary>/, '<section class="hero-sheet hero-modal-section"><h3>Навыки и снаряжение</h3>');
        content=content.slice(0,-10)+'</section>';
        return `<section class="hero-modal-section"><h3>Характеристики</h3>${statInputs(hero)}<div class="hero-options"><label>Скорость <input class="hero-speed" type="number" min="0" value="${num(hero.speed,30)}"> фт</label><span>КД <b>${hero.ac}</b></span><span>Инициатива <b>${signed(hero.initBonus)}</b></span><span>Сл <b>${hero.spellSaveDC}</b> · Атака <b>${signed(hero.spellAttack)}</b></span></div></section>${slots(hero)}${content}`;
    }
    function bind(card,hero,changed) {
        const h=hero.heroControls;
        const on=(selector,apply,event='change')=>card.querySelectorAll(selector).forEach(el=>el.addEventListener(event,e=>{
            e.stopPropagation();apply(el);recalculate(hero);changed();
        }));
        on('.hero-detail-use-slot',el=>{const slot=hero.spellSlots[el.dataset.level];slot.used=Math.min(slot.max,(slot.used||0)+1);},'click');
        on('.hero-detail-restore-slot',el=>{const slot=hero.spellSlots[el.dataset.level];slot.used=Math.max(0,(slot.used||0)-1);},'click');
        on('.hero-detail-slot-max',el=>{const slot=hero.spellSlots[el.dataset.level];slot.max=Math.max(0,Math.floor(num(el.value)));slot.used=Math.min(slot.max,slot.used||0);});
        on('.hero-score',el=>{const score=Math.max(1,Math.min(30,num(el.value,10)));hero.stats[el.dataset.key].score=score;(hero.heroData.stats ||= {})[el.dataset.key]={...(hero.heroData.stats?.[el.dataset.key]||{}),score};});
        on('.hero-inspiration',()=>hero.inspiration=!hero.inspiration,'click');
        on('.hero-shield',()=>h.shield=!h.shield,'click');
        on('.hero-speed',el=>hero.speed=Math.max(0,num(el.value)));
        on('.hero-proficiency',el=>h.proficiency=Math.max(0,Math.min(12,num(el.value,2))));
        on('.hero-save-bonus',el=>h.saveBonus=num(el.value));
        on('.hero-base-ac',el=>h.baseAc=num(el.value,10));
        on('.hero-save-prof',el=>hero.heroData.saves[el.dataset.key].isProf=el.checked);
        on('.hero-skill-prof',el=>hero.heroData.skills[el.dataset.key].isProf=num(el.value));
        on('.hero-spell-ability',el=>h.spellAbility=el.value);
        on('.hero-spell-dc-extra',el=>h.spellDcExtra=num(el.value));
        on('.hero-spell-attack-extra',el=>h.spellAttackExtra=num(el.value));
        on('.hero-weapon-ability',el=>{const w=h.weapons[el.dataset.index];const old=weaponAttack(hero,w);w.damage=weaponDamage(hero,w);w.ability=el.value;w.originalMod=el.value?hero.stats[el.value].mod:0;w.attackExtra=old-w.originalMod-(w.proficient?hero.proficiency:0);});
        on('.hero-weapon-prof',el=>h.weapons[el.dataset.index].proficient=el.checked);
        on('.hero-weapon-extra',el=>h.weapons[el.dataset.index].attackExtra=num(el.value));
        on('.hero-item-add',()=>h.items.push({name:'Магический предмет',bonus:1,enabled:true}),'click');
        on('.hero-item-name',el=>h.items[el.dataset.index].name=el.value);
        on('.hero-item-bonus',el=>h.items[el.dataset.index].bonus=num(el.value));
        on('.hero-item-enabled',el=>h.items[el.dataset.index].enabled=el.checked);
        on('.hero-item-remove',el=>h.items.splice(Number(el.dataset.index),1),'click');
        card.querySelector('.hero-sheet')?.addEventListener('toggle',e=>{hero.heroPanelOpen=e.target.open;});
        card.addEventListener('dragstart',e=>{if(e.target.closest('input,button,select,summary,table'))e.preventDefault();});
    }
    const api={ensure,recalculate,statInputs,panel,quick,summaryStats,slots,details,bind,weaponAttack,weaponDamage};
    root.HeroCard=api;
    if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
