const fs=require('node:fs'),assert=require('node:assert/strict'),zlib=require('node:zlib'),crypto=require('node:crypto');
const F=require('../foundry-data'),B=require('../bestiary');
const manifest=JSON.parse(fs.readFileSync('foundry-data.json','utf8'));
const raw=zlib.gunzipSync(Buffer.from(manifest.files.map(f=>fs.readFileSync(f,'utf8')).join(''),'base64'));
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),manifest.sha256);
const data=JSON.parse(raw);assert.equal(data.monsters.length,3396);assert.equal(data.spells.length,1125);
const monster=en=>B.organize(F.applyMonster({},data.monsters.find(m=>m.name.endsWith('/ '+en))));
const vecna=monster('Vecna the Archlich');assert.equal(vecna.source.book,'VEoR');assert.equal(vecna.legendary_actions.length,0);assert.equal(vecna.bonus_actions.length,1);assert.equal(vecna.reactions.length,2);assert(vecna.actions.some(i=>i.name==='Заклинания'));assert.equal(vecna.passivePerception,25);assert.match(vecna.skills,/Магия \+22/);
const spellcasting=vecna.actions.find(i=>i.name==='Заклинания');assert.doesNotMatch(spellcasting._displayDescription,/@UUID\[\./);assert.match(spellcasting._displayDescription,/2 в день каждое/);assert.match(spellcasting._displayDescription,/@UUID\[Compendium/);
const strahd=monster('Strahd von Zarovich');assert(strahd.features.some(i=>i.name==='Регенерация'));assert(!strahd.actions.some(i=>i.name==='Регенерация'));assert(strahd.actions.some(i=>i.name==='Укус'));assert.equal(strahd.legendary_actions.find(i=>i.name==='Укус').cost,2);assert.equal(strahd.lair_actions.length,4);assert.match(strahd.damage_resistances,/от немагических атак/);
const drow=monster('Drow Matron Mother');assert.equal(drow.bonus_actions.length,2);assert.equal(drow.features.length,3);assert.equal(drow.lair_actions.length,3);
const web=data.spells.find(s=>s.name.endsWith('/ Web'));const sp=F.applySpell({subclasses:[]},web);assert.equal(sp.range,'60 ft');assert.equal(sp.duration,'1 hour');assert(sp.concentration);assert(sp.components.material);assert.equal(sp.components.materialDesc,'обрывок паутины');assert(sp.subclasses.every(s=>!/[a-z]+\)$/.test(s)));
assert.equal(B.organize(F.applyMonster({ac:14,image:'token.webp',_sectionRules:[{name:'Мультиатака',section:'features',attack:false}]},vecna)).ac,18);
assert.equal(F.applyMonster({ac:14},{name:'test'}).ac,14);
for(const m of data.monsters){assert(m.source);for(const key of ['features','actions','bonus_actions','reactions','legendary_actions','lair_actions','regional_effects']){assert(Array.isArray(m[key]));for(const i of m[key])assert(i._rawSection);}}
console.log('PASS full dataset integrity, version-specific Vecna, Strahd action costs/lair/passive regeneration, Drow bonus actions, authoritative spell parameters, subclass labels and all sections');
