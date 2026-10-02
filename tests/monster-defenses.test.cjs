const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const fixes=JSON.parse(fs.readFileSync('monster-defenses.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('foundry-data.json','utf8'));
const data=JSON.parse(zlib.gunzipSync(Buffer.from(manifest.files.map(f=>fs.readFileSync(f,'utf8')).join(''),'base64')));
for(const raw of data.monsters){
 if(raw.damage_vulnerabilities)assert.equal(fixes[raw.name]?.damage_vulnerabilities,raw.damage_vulnerabilities,raw.name);
 if(/physical/.test(raw.damage_resistances+' '+raw.damage_immunities))assert(!/physical/.test(JSON.stringify(fixes[raw.name])),raw.name);
}
assert.equal(fixes['Скелет / Skeleton'].damage_vulnerabilities,'дробящий');
assert.match(fixes['Дэтлок / Deathlock'].damage_resistances,/дробящий, колющий, рубящий/);
const html=fs.readFileSync('index.html','utf8');
const ctx=vm.createContext({});
vm.runInContext(html.match(/const translations = ([\s\S]*?);\s*const skillTranslations/)[0].split('const skillTranslations')[0]+html.match(/function translateList\([\s\S]*?\n    }/)[0]+';this.translate=translateList;',ctx);
assert.equal(ctx.translate('necrotic; physical','damage'),'некротический; дробящий, колющий, рубящий');
assert.equal(ctx.translate('дробящий от немагических атак','damage'),'дробящий от немагических атак');
const {build}=require('../monster-builder');
assert.equal(build({name:'Test',vulner:'огонь'}).damage_vulnerabilities,'огонь');
console.log('PASS all exported vulnerabilities, physical defenses, Russian labels and custom monster vulnerabilities');
