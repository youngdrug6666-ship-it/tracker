(function(root){
    'use strict';
    const encode=value=>JSON.stringify(value,(_,v)=>v instanceof Set?{__type:'Set',values:[...v]}:v);
    const decode=text=>JSON.parse(text,(_,v)=>v&&v.__type==='Set'?new Set(v.values):v);
    function create(limit=30){
        let baseline=null,entries=[];
        return {
            reset(state){baseline=encode(state);entries=[];},
            commit(state){const next=encode(state);if(baseline===null){baseline=next;return;}if(next!==baseline){entries.push(baseline);if(entries.length>limit)entries.shift();baseline=next;}},
            undo(){if(!entries.length)return null;baseline=entries.pop();return decode(baseline);},
            get size(){return entries.length;}
        };
    }
    root.CombatHistory={create};
    if(typeof module!=='undefined')module.exports=root.CombatHistory;
})(typeof window==='undefined'?globalThis:window);
