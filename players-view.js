(() => {
  const key='dnd_player_display_v1',stage=document.getElementById('stage'),order=document.getElementById('order');
  let state=null,selected=null,following=true,signature='',orderSignature='',received=0,renderedId=null,deckDirection=1;
  let fitObserver=null;
  const healthLabels={healthy:'Невредим',wounded:'Ранен',injured:'Сильно ранен',bloodied:'Окровавлен',critical:'Тяжёлая травма',down:'Выведен из боя',unknown:''};
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(key):null;
  function make(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
  function safeImage(value){if(typeof value!=='string'||!value.trim())return '';if(/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(value))return value;try{const u=new URL(value,location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
  function receive(message){
    if(message?.version!==1 || !Array.isArray(message.participants))return;
    const participants=message.participants.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Number.isFinite(p.initiative)&&p.initiative!==0).map(p=>{
      const isAlly=!p.isMonster||p.isAlly===true;
      const result={id:p.id,name:p.name,initiative:p.initiative,image:safeImage(p.image),isMonster:!!p.isMonster,isAlly,health:Object.hasOwn(healthLabels,p.health)?p.health:'unknown',conditions:Array.isArray(p.conditions)?p.conditions.filter(v=>typeof v==='string').slice(0,24):[]};
      if(isAlly&&p.metrics)result.metrics={hp:Number.isFinite(p.metrics.hp)?p.metrics.hp:null,maxHp:Number.isFinite(p.metrics.maxHp)?p.metrics.maxHp:null,tempHp:Number(p.metrics.tempHp)||0,ac:Number.isFinite(p.metrics.ac)?p.metrics.ac:null};
      return result;
    });
    const currentId=participants.some(p=>p.id===message.currentId)?message.currentId:null;
    if(state && state.currentId!==currentId){
      const previous=state.participants.findIndex(p=>p.id===state.currentId),next=participants.findIndex(p=>p.id===currentId);
      if(previous>=0&&next>=0)deckDirection=next===(previous+1)%participants.length?1:next===(previous-1+participants.length)%participants.length?-1:Math.sign(next-previous)||1;
      following=true;selected=currentId;
    }
    state={participants,currentId,round:Number(message.round)||0};
    received=Number(message.sentAt)||Date.now();
    if(following)selected=currentId;
    if(selected && !participants.some(p=>p.id===selected)){following=true;selected=currentId;}
    render();connection();
  }
  function connection(){const live=received>0&&Date.now()-received<16000;const el=document.getElementById('connection');el.textContent=live?'Связь с мастером':received?'Мастер не на связи':'Ожидание мастера';el.classList.toggle('connected',live);}
  function render(){
    const list=state?.participants||[],chosen=list.find(p=>p.id===selected),active=!!chosen&&chosen.id===state.currentId;
    document.getElementById('round').textContent='Раунд '+(state?state.round:'—');
    const nextSignature=JSON.stringify([chosen||null,active,!!state,list.map(p=>[p.id,p.name,p.image])]);
    if(signature!==nextSignature){
      const changing=!!chosen&&renderedId!==chosen.id;
      const previous=changing?stage.querySelector('.public-card:not(.deck-exit)')?.cloneNode(true):null;
      signature=nextSignature;fitObserver?.disconnect();stage.replaceChildren();
      if(previous){previous.classList.add('deck-exit');previous.classList.remove('deck-enter');previous.setAttribute('aria-hidden','true');previous.style.setProperty('--direction',deckDirection);previous.querySelectorAll('.turn-flames').forEach(el=>el.remove());stage.append(previous);setTimeout(()=>previous.remove(),650);}
      renderedId=chosen?.id||null;
      if(chosen){
        const deck=make('div','fan-deck');deck.setAttribute('aria-label','Другие участники');
        const others=list.filter(p=>p.id!==chosen.id).slice(0,10);
        others.forEach((p,i)=>{
          const offset=i-(others.length-1)/2;
          const side=offset===0?1:Math.sign(offset);
          const spread=offset+side*.8;
          const preview=make('button','fan-card'+(p.id===state.currentId?' current':''));preview.type='button';preview.style.left=(50+spread*70/Math.max(3,others.length+2))+'%';preview.style.setProperty('--offset',spread);preview.style.setProperty('--tilt',spread*7+'deg');preview.style.setProperty('--rise',Math.abs(spread)*9+'px');preview.style.zIndex=String(10-Math.floor(Math.abs(spread)));preview.setAttribute('aria-label','Посмотреть '+p.name);
          if(p.image){const img=make('img');img.src=p.image;img.alt='';img.onerror=()=>img.remove();preview.append(img);}
          preview.append(make('span','fan-name',p.name));preview.onclick=()=>{following=false;selected=p.id;render();};deck.append(preview);
        });stage.append(deck);
        const card=make('article','public-card'+(active?' active':'')+(changing?' deck-enter':''));card.style.setProperty('--direction',deckDirection);
        const artSpace=make('div','art-space'),art=make('div','art-frame '+chosen.health);
        if(chosen.image){
          const portrait=make('img','portrait');portrait.src=chosen.image;portrait.alt=chosen.name;
          const fit=()=>{const box={width:artSpace.clientWidth,height:artSpace.clientHeight};const ratio=portrait.naturalWidth&&portrait.naturalHeight?portrait.naturalWidth/portrait.naturalHeight:.72;const width=Math.min(box.width,box.height*ratio);art.style.width=width+'px';art.style.height=(width/ratio)+'px';};
          portrait.onload=fit;portrait.onerror=()=>{portrait.remove();art.prepend(make('div','placeholder',chosen.isMonster?'◆':'✦'));};art.append(portrait);
          fitObserver=new ResizeObserver(fit);fitObserver.observe(artSpace);
        }else art.append(make('div','placeholder',chosen.isMonster?'◆':'✦'));
        art.append(make('div','card-shade'));
        if(active){const flame=make('div','turn-flames');flame.setAttribute('aria-hidden','true');art.append(flame);}
        const initiative=make('div','initiative-value');initiative.append(make('strong','',chosen.initiative),make('span','','ИНИЦИАТИВА'));art.append(initiative);
        const status=make('div','card-status',active?'СЕЙЧАС ХОДИТ':'ПРОСМОТР УЧАСТНИКА');art.append(status);artSpace.append(art);card.append(artSpace);
        const heading=make('div','card-heading');heading.append(make('h2','',chosen.name));
        const badges=make('div','public-badges');
        if(healthLabels[chosen.health])badges.append(make('span','health-badge '+chosen.health,((chosen.health==='bloodied'||chosen.health==='critical')?'🩸 ':chosen.health==='wounded'?'✚ ':'')+healthLabels[chosen.health]));
        if(chosen.metrics){const m=chosen.metrics;badges.append(make('span','ally-metric','♥ '+(m.hp??'—')+' / '+(m.maxHp??'—')+(m.tempHp?' · +'+m.tempHp+' врем.':'')),make('span','ally-metric','🛡 КД '+(m.ac??'—')));}
        chosen.conditions.forEach(condition=>badges.append(make('span','state-badge'+(/концентра/i.test(condition)?' concentration':''),(/концентра/i.test(condition)?'◎ ':'◈ ')+condition)));
        heading.append(badges);card.append(heading);stage.append(card);
      }else{
        const empty=make('div','empty');empty.append(make('h2','',list.length?'Ожидание следующего хода':'Стол готов к приключению'));
        empty.append(make('p','',list.length?'Мастер выбирает участника. Можно посмотреть карточки стрелками или в списке справа.':'Участники появятся, когда мастер назначит им инициативу.'));
        if(!state)empty.append(make('small','','Открой этот экран из меню трекера в том же браузере. Для телевизора перенеси окно на второй монитор. Отдельные устройства по сети пока не подключаются.'));
        stage.append(empty);
      }
    }
    const nextOrder=JSON.stringify([list,state?.currentId,selected]);
    if(nextOrder!==orderSignature){
      orderSignature=nextOrder;order.replaceChildren();
      list.forEach((p,index)=>{
        const li=make('li'),button=make('button','order-item'+(p.id===state.currentId?' active':'')+(p.id===selected?' selected':''));
        button.type='button';button.setAttribute('aria-label',p.name+', инициатива '+p.initiative+(p.id===state.currentId?', сейчас ходит':''));
        if(p.id===state.currentId)button.setAttribute('aria-current','true');
        button.append(make('span','order-number',index+1));
        if(p.image){const img=make('img','order-image');img.src=p.image;img.alt='';img.onerror=()=>{img.replaceWith(make('span','order-image','◆'));};button.append(img);}else button.append(make('span','order-image',p.isMonster?'◆':'✦'));
        const copy=make('span','order-copy');copy.append(make('span','order-name',p.name));if(p.health==='wounded'||p.health==='injured'||p.health==='bloodied'||p.health==='critical'||p.health==='down')copy.append(make('span','order-health '+p.health,healthLabels[p.health]));if(p.conditions.length)copy.append(make('span','order-conditions',p.conditions.join(' · ')));button.append(copy,make('span','order-init',p.initiative));button.onclick=()=>{following=false;selected=p.id;render();};li.append(button);order.append(li);
      });
      order.querySelector('[aria-current="true"]')?.scrollIntoView({block:'nearest'});
    }
    const index=list.findIndex(p=>p.id===selected);
    document.getElementById('position').textContent=list.length?(index>=0?index+1:'—')+' / '+list.length:'—';
    for(const id of ['previous','following'])document.getElementById(id).disabled=!list.length;
    const follow=document.getElementById('follow');follow.classList.toggle('following',following);follow.textContent=following?'За текущим ходом':'К текущему ходу';follow.disabled=!state?.currentId;
  }
  function browse(delta){deckDirection=delta;const list=state?.participants||[];if(!list.length)return;let index=list.findIndex(p=>p.id===selected);if(index<0)index=delta>0?-1:0;following=false;selected=list[(index+delta+list.length)%list.length].id;render();}
  document.getElementById('previous').onclick=()=>browse(-1);document.getElementById('following').onclick=()=>browse(1);
  document.getElementById('follow').onclick=()=>{following=true;selected=state?.currentId;render();};
  document.getElementById('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{document.getElementById('fullscreen').textContent='Используй F11';}};
  document.addEventListener('fullscreenchange',()=>{document.getElementById('fullscreen').textContent=document.fullscreenElement?'⛶ Выйти из полного экрана':'⛶ Полный экран';});
  document.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();browse(-1);}if(event.key==='ArrowRight'){event.preventDefault();browse(1);}});
  let touchX=null;stage.addEventListener('touchstart',event=>{touchX=event.touches[0].clientX;},{passive:true});stage.addEventListener('touchend',event=>{if(touchX===null)return;const delta=event.changedTouches[0].clientX-touchX;touchX=null;if(Math.abs(delta)>60)browse(delta<0?1:-1);},{passive:true});
  channel?.addEventListener('message',event=>receive(event.data));
  window.addEventListener('storage',event=>{if(event.key===key&&event.newValue){try{receive(JSON.parse(event.newValue));}catch{}}});
  try{const cached=localStorage.getItem(key);if(cached)receive(JSON.parse(cached));}catch{}
  channel?.postMessage({type:'request'});setInterval(connection,3000);render();
})();
