const fs=require('fs'),assert=require('node:assert/strict'),vm=require('vm');
const raw=JSON.parse(fs.readFileSync(__dirname+'/../monsters_full_export.json','utf8').replace(/^\uFEFF/,''));
const base=raw.find(m=>/\/\s*Vampire Spawn\s*$/i.test(m.name));assert.ok(base);
const original=JSON.stringify(base),variants=require('../coffin-spawn-variants.js').build(base);
assert.equal(variants.length,6);assert.equal(JSON.stringify(base),original);
assert.equal(new Set(variants.map(m=>m.name)).size,6);
assert.equal(variants.find(m=>m.name.includes('следопыт')).spells[0],"hunter's mark");
assert.equal(variants.find(m=>m.name.includes('паладин')).spellSlots[1].max,3);
assert.equal(variants.find(m=>m.name.includes('волшебник')).spellSlots[2].max,2);
for(const m of variants){assert.equal(m.hpAvg,82);assert.equal(m.initBonus,base.initBonus??base.stats.dex.mod);assert.ok(m.actions.length);assert.ok(m.features.length);}
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
console.log('PASS: six independent variants, base preserved, spell slots, hunter mark, integration syntax');
