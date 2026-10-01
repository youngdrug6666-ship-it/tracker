// Foundry VTT: create a Script macro, paste this entire file, run as GM.
// Read-only export. Does not modify documents or send data anywhere.
(async () => {
  if (!game.user?.isGM) return ui.notifications.warn('Экспорт запускается от имени мастера.');
  const escape = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const packs = Array.from(game.packs).filter(p => ['Actor','Item'].includes(p.documentName ?? p.metadata?.type));
  if (!packs.length) return ui.notifications.warn('Нет доступных сборников монстров или предметов.');
  const chosen = await new Promise(resolve => {
    const panel = document.createElement('dialog');
    panel.style.cssText='width:min(850px,90vw);max-height:85vh;padding:24px;background:#18212c;color:#eee;border:1px solid #7e8b98;border-radius:12px;overflow:auto;z-index:100000';
    const preferred = p => /laaru-dnd5-hw/i.test(p.collection) && !/2024|dnd24|5e24/i.test(p.collection+' '+p.metadata?.label);
    panel.innerHTML='<h2>Полный экспорт для трекера</h2><p>Выберите сборники правил 2014 года. Нужны монстры, заклинания, классы, подклассы и особенности. Встроенные предметы монстров сохраняются полностью.</p><p>Документы мира и персонажи игроков не экспортируются. Файл будет скачан на ваш компьютер.</p><div style="display:grid;gap:7px">'+packs.map((p,i)=>'<label style="display:flex;gap:8px;align-items:start"><input type="checkbox" data-pack-index="'+i+'" '+(preferred(p)?'checked':'')+'><span>'+escape(p.metadata?.label||p.collection)+' <small style="opacity:.7">['+escape(p.collection)+'] '+escape(p.documentName)+'</small></span></label>').join('')+'</div><div style="display:flex;gap:12px;margin-top:20px"><button type="button" data-start>Скачать JSON</button><button type="button" data-cancel>Отмена</button></div>';
    document.body.appendChild(panel);
    let done=false;
    const finish=value=>{if(done)return;done=true;panel.close();panel.remove();resolve(value);};
    panel.querySelector('[data-start]').onclick=()=>{const indices=Array.from(panel.querySelectorAll('input:checked')).map(x=>Number(x.dataset.packIndex));if(!indices.length)return ui.notifications.warn('Выберите хотя бы один сборник.');finish(indices.map(i=>packs[i]));};
    panel.querySelector('[data-cancel]').onclick=()=>finish(null);
    panel.addEventListener('cancel',e=>{e.preventDefault();finish(null);});
    panel.showModal();
  });
  if (!chosen) return;
  const manifest = {
    format:'masterm4c9-tracker-foundry-raw', schemaVersion:1,
    exportedAt:new Date().toISOString(), foundryVersion:game.version,
    system:{id:game.system.id,version:game.system.version}, rules:'2014',
    packs:[], errors:[],
    coverage:{actors:0,items:0,embeddedItems:0,itemsWithActivities:0,itemsWithLegacyActivation:0,spells:0,classes:0,subclasses:0}
  };
  const records=[];
  ui.notifications.info('Начат экспорт. Дождитесь скачивания JSON; не закрывайте вкладку.');
  const inspect=item=>{
    const sys=item.system||{};
    if(sys.activities && Object.keys(sys.activities).length)manifest.coverage.itemsWithActivities++;
    if(sys.activation?.type)manifest.coverage.itemsWithLegacyActivation++;
    if(item.type==='spell')manifest.coverage.spells++;
    if(item.type==='class')manifest.coverage.classes++;
    if(item.type==='subclass')manifest.coverage.subclasses++;
  };
  for (const pack of chosen) {
    const info={id:pack.collection,label:pack.metadata?.label,type:pack.documentName,documents:0};
    manifest.packs.push(info);
    try {
      const documents=await pack.getDocuments();
      for (const doc of documents) {
        const raw=doc.toObject();
        if(pack.documentName==='Actor' && raw.type!=='npc')continue;
        // Keep the complete raw document: system, activities, activation, effects,
        // flags, source, advancement, embedded items and IDs. No text extraction.
        const record={kind:pack.documentName==='Actor'?'actor':'item',pack:pack.collection,uuid:doc.uuid,document:raw};
        if(record.kind==='actor'){
          manifest.coverage.actors++;manifest.coverage.embeddedItems+=(raw.items||[]).length;
          record.embeddedUuids=Object.fromEntries(Array.from(doc.items||[]).map(i=>[i.id,i.uuid]));
          (raw.items||[]).forEach(inspect);
        } else {manifest.coverage.items++;inspect(raw);}
        records.push(record);info.documents++;
      }
    } catch(error) {manifest.errors.push({pack:pack.collection,message:String(error.message||error)});}
  }
  if (!records.length) return ui.notifications.error('Ничего не выгружено. Проверьте выбранные сборники и права доступа.');
  // Keep each part below 24 MiB so files can be uploaded to the chat.
  const encoder=new TextEncoder(),limit=23*1024*1024,chunks=[];
  let chunk=[],size=0;
  for(const record of records){const bytes=encoder.encode(JSON.stringify(record)).length;if(chunk.length && size+bytes>limit){chunks.push(chunk);chunk=[];size=0;}chunk.push(record);size+=bytes;}
  if(chunk.length)chunks.push(chunk);
  const stamp=manifest.exportedAt.replace(/[:.]/g,'-');
  for(let i=0;i<chunks.length;i++){
    const payload={...manifest,part:i+1,parts:chunks.length,records:chunks[i]};
    const blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download='tracker-foundry-full-'+stamp+(chunks.length>1?'-part-'+(i+1):'')+'.json';document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  console.info('Tracker export manifest',manifest);
  const summary='Экспорт готов: '+manifest.coverage.actors+' монстров, '+manifest.coverage.items+' предметов; файлов: '+chunks.length+'.';
  if(manifest.errors.length)ui.notifications.warn(summary+' Не прочитаны сборники: '+manifest.errors.map(e=>e.pack).join(', '));else ui.notifications.info(summary);
})();
