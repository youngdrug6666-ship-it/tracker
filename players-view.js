(() => {
  const key='dnd_player_display_v1',stage=document.getElementById('stage'),order=document.getElementById('order');
  let state=null,selected=null,following=true,signature='',orderSignature='',received=0;
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel(key):null;
  function make(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
  function safeImage(value){if(typeof value!=='string')return '';if(/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(value))return value;try{const u=new URL(value,location.href);return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
  function receive(message){
    if(message?.version!==1 || !Array.isArray(message.participants))return;
    const participants=message.participants.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&Number.isFinite(p.initiative)&&p.initiative!==0).map(p=>({id:p.id,name:p.name,initiative:p.initiative,image:safeImage(p.image),isMonster:!!p.isMonster}));
    const currentId=participants.some(p=>p.id===message.currentId)?message.currentId:null;
    if(state && state.currentId!==currentId){following=true;selected=currentId;}
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
    const nextSignature=JSON.stringify([chosen||null,active,!!state,list.length]);
    if(signature!==nextSignature){
      signature=nextSignature;stage.replaceChildren();
      if(chosen){
        const card=make('article','public-card'+(active?' active':''));
        if(chosen.image){
          const backdrop=make('div','portrait-backdrop');backdrop.style.backgroundImage='url('+JSON.stringify(chosen.image)+')';card.append(backdrop);
          const portrait=make('img','portrait');portrait.src=chosen.image;portrait.alt=chosen.name;portrait.onerror=()=>{portrait.remove();card.prepend(make('div','placeholder',chosen.isMonster?'◆':'✦'));};card.append(portrait);
        }else card.append(make('div','placeholder',chosen.isMonster?'◆':'✦'));
        card.append(make('div','card-shade'));
        if(active){const flame=make('div','turn-flames');flame.setAttribute('aria-hidden','true');card.append(flame);}
        const heading=make('div','card-heading');heading.append(make('div','card-status',active?'СЕЙЧАС ХОДИТ':'ПРОСМОТР УЧАСТНИКА'),make('h2','',chosen.name));card.append(heading);
        const initiative=make('div','initiative-value');initiative.append(make('strong','',chosen.initiative),make('span','','ИНИЦИАТИВА'));card.append(initiative);stage.append(card);
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
        button.append(make('span','order-name',p.name),make('span','order-init',p.initiative));button.onclick=()=>{following=false;selected=p.id;render();};li.append(button);order.append(li);
      });
      order.querySelector('[aria-current="true"]')?.scrollIntoView({block:'nearest'});
    }
    const index=list.findIndex(p=>p.id===selected);
    document.getElementById('position').textContent=list.length?(index>=0?index+1:'—')+' / '+list.length:'—';
    for(const id of ['previous','following'])document.getElementById(id).disabled=!list.length;
    const follow=document.getElementById('follow');follow.classList.toggle('following',following);follow.textContent=following?'За текущим ходом':'К текущему ходу';follow.disabled=!state?.currentId;
  }
  function browse(delta){const list=state?.participants||[];if(!list.length)return;let index=list.findIndex(p=>p.id===selected);if(index<0)index=delta>0?-1:0;following=false;selected=list[(index+delta+list.length)%list.length].id;render();}
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
