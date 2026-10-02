const assert=require('node:assert/strict');const {create}=require('../combat-history.js');
const h=create(2),state={combatants:[{currentHp:30,conditions:new Set(['Концентрация']),spellSlots:{1:{max:4,used:0}},activeSpellEffects:[{id:'a'}]}],currentRound:1,currentTurnIndex:0,nextId:2};
h.reset(state);h.commit(state);assert.equal(h.size,0);
state.combatants[0].currentHp=20;state.combatants[0].spellSlots[1].used=1;state.combatants[0].conditions.clear();h.commit(state);
const old=h.undo();assert.equal(old.combatants[0].currentHp,30);assert.equal(old.combatants[0].spellSlots[1].used,0);assert(old.combatants[0].conditions instanceof Set);assert(old.combatants[0].conditions.has('Концентрация'));assert.equal(old.combatants[0].activeSpellEffects[0].id,'a');assert.equal(h.undo(),null);
h.reset(state);for(let i=0;i<4;i++){state.currentRound++;h.commit(state)}assert.equal(h.size,2);h.reset(state);assert.equal(h.size,0);
console.log('PASS undo restores HP, slots, conditions/effects; unchanged state, bounded history and session reset');
