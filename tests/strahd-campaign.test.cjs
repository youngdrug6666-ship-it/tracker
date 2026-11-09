const a=require('node:assert/strict'),R=require('../strahd-boss-rules.js'),C=require('../strahd-campaign.js');
let s={id:1,name:'Страд фон Зарович / Strahd von Zarovich',ac:16,currentHp:60,maxHp:144};
R.armor(s,true);R.heart(s,true);a.equal(s.ac,21);a.deepEqual(R.absorb(s,120),{heart:100,armor:20,remaining:0});
R.heart(s,false);R.heart(s,true);a.equal(s.strahdBoss.heartHp,0);a.equal(R.regenerate(s),0);
a.equal(R.absorb(s,140).remaining,10);a.equal(s.strahdBoss.armor,false);a.equal(s.ac,16);R.armor(s,true);a.equal(s.strahdBoss.armor,false);
R.dawn(s);R.armor(s,true);a.equal(s.strahdBoss.armorHp,150);R.repairHeart(s);a.equal(R.regenerate(s),30);
s.currentHp=140;a.equal(R.regenerate(s),4);a.equal(s.currentHp,144);
const m=[{id:2,name:'Морганта — Мать Кошмаров',covenRole:'morgantha',currentHp:160},{id:3,covenRole:'control',currentHp:105},{id:4,covenRole:'defense',currentHp:105}];
const p=C.poolFor(m[0],m).pool;a.equal(C.state(m[0],m).max,3);
a.equal(R.spendCoven(p,m,'scream'),true);p.used=0;a.equal(R.spendCoven(p,m,'scream'),false);
m[1].currentHp=0;a.equal(C.state(m[0],m).spells,false);a.equal(C.state(m[0],m).max,2);a.equal(R.spendCoven(p,m,'protect'),true);
m[2].currentHp=0;p.used=0;a.equal(R.spendCoven(p,m,'protect'),false);a.equal(R.spendCoven(p,m,'whisper'),true);
m[0].currentHp=0;a.equal(C.state(m[0],m).max,0);
m[0].currentHp=160;p.used=2;m[0].covenProtection={remaining:9};m[0].tempHp=9;C.startTurn(m[0],m,2);a.equal(p.used,0);a.equal(m[0].tempHp,0);
p.used=1;C.startTurn(m[0],m,2);a.equal(p.used,1);
a.ok(C.books.length===6);a.ok(C.books[5].spells.includes('steel wind strike'));
console.log('PASS: armor depletion/dawn, heart no-refill and healing cap, shared coven pool/deaths, scream once, mother turn reset and protection expiration, six spellbooks');

const victim={id:99,speed:30,reactionsBlocked:false};C.applyGrasp(victim);a.equal(victim.speed,0);a.equal(victim.reactionsBlocked,true);C.startTurn(victim,[victim],1);a.equal(victim.speed,30);a.equal(victim.reactionsBlocked,false);
