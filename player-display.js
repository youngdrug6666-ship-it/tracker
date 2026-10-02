/* Explicit public projection: no monster mechanics or pending participants. */
(function(root){
  function image(value){
    if(typeof value!=='string')return '';
    if(/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(value))return value;
    try{const url=new URL(value,typeof location==='object'?location.href:'https://example.invalid/');return /^https?:$/.test(url.protocol)?url.href:'';}catch{return '';}
  }
  function project(combatants,currentIndex,round){
    const visible=combatants.filter(c=>Number.isFinite(Number(c.initiative))&&Number(c.initiative)!==0);
    const active=combatants[currentIndex];
    return {version:1,round:Number(round)||0,currentId:active&&visible.includes(active)?String(active.id):null,
      participants:visible.map(c=>({id:String(c.id),name:String(c.name||'Участник').split(/\s+\/\s+/)[0],initiative:Number(c.initiative),image:image(c.avatar),isMonster:!!c.isMonster}))};
  }
  function step(combatants,index,direction){
    if(!combatants.length)return null;
    let next=index,wrapped=false;
    for(let i=0;i<combatants.length;i++){
      next+=direction;
      if(next>=combatants.length){next=0;wrapped=true;}
      if(next<0){next=combatants.length-1;wrapped=true;}
      if(Number.isFinite(Number(combatants[next].initiative))&&Number(combatants[next].initiative)!==0)return {index:next,wrapped};
    }
    return null;
  }
  const api={project,step};
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(typeof window!=='object')return;
  let state=null;
  const key='dnd_player_display_v1';
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(key):null;
  function send(){if(!state)return;const message={...state,sentAt:Date.now()};channel?.postMessage(message);try{localStorage.setItem(key,JSON.stringify(message));}catch{}}
  api.publish=(combatants,index,round)=>{state=project(combatants,index,round);send();};
  channel?.addEventListener('message',event=>{if(event.data?.type==='request')send();});
  setInterval(send,5000);
  root.PlayerDisplay=api;
})(typeof window==='object'?window:globalThis);
