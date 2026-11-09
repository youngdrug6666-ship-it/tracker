const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const pack=JSON.parse(fs.readFileSync('strahd-supplements.json','utf8'));
assert.equal(pack.monsters.length,119);assert.equal(new Set(pack.monsters.map(m=>m.name)).size,119);
for(const name of ['Лесная Фея','Горная Фея','Водная Фея','Гончая Фей','Гитрог','Детеныш Гитрога','Наккер','Людмила Вилишевич','Статуя Девы Шитоносца'])assert(pack.monsters.some(m=>m.baseName===name),name);
for(const m of pack.monsters){assert.equal(Object.keys(m.stats).length,6,m.name);assert(m.hpAvg>0,m.name);assert(m.ac>0,m.name);assert(m._sourceFiles.length,m.name);assert(m.image,m.name);assert(fs.existsSync(path.resolve(m.image)),m.image);for(const key of ['features','actions','bonus_actions','reactions','legendary_actions','lair_actions'])for(const e of m[key]||[]){assert(e.name,m.name);assert(e.description,m.name);}}
const blood=pack.monsters.find(m=>m.baseName==='Друид Крови');assert.equal(blood.spellSlots['8'].max,1);
const queen=pack.monsters.find(m=>m.baseName==='Паучья Королева');assert(queen.legendary_actions.length>=4);assert(queen.spellGroups.some(g=>g.label==='3/день каждое'));
console.log('PASS 119 PDF blocks, required creatures including Tsolenka, complete stats, spell slots, legendary actions, provenance and all portrait files');
