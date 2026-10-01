// Foundry VTT: create a Script macro, paste this entire file, run as GM.
// Read-only export. Does not modify documents or send data anywhere.
(async () => {
  if (!game.user?.isGM) return ui.notifications.warn('\u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u0437\u0430\u043f\u0443\u0441\u043a\u0430\u0435\u0442\u0441\u044f \u043e\u0442 \u0438\u043c\u0435\u043d\u0438 \u043c\u0430\u0441\u0442\u0435\u0440\u0430.');
  const escape = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const packs = Array.from(game.packs).filter(p => ['Actor','Item'].includes(p.documentName ?? p.metadata?.type));
  if (!packs.length) return ui.notifications.warn('\u041d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b\u0445 \u0441\u0431\u043e\u0440\u043d\u0438\u043a\u043e\u0432 \u043c\u043e\u043d\u0441\u0442\u0440\u043e\u0432 \u0438\u043b\u0438 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432.');
  const chosen = await new Promise(resolve => {
    const panel = document.createElement('dialog');
    panel.style.cssText='width:min(850px,90vw);max-height:85vh;padding:24px;background:#18212c;color:#eee;border:1px solid #7e8b98;border-radius:12px;overflow:auto;z-index:100000';
    const preferred = p => /laaru-dnd5-hw/i.test(p.collection) && !/2024|dnd24|5e24/i.test(p.collection+' '+p.metadata?.label);
    panel.innerHTML='<h2>\u041f\u043e\u043b\u043d\u044b\u0439 \u044d\u043a\u0441\u043f\u043e\u0440\u0442 \u0434\u043b\u044f \u0442\u0440\u0435\u043a\u0435\u0440\u0430</h2><p>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0431\u043e\u0440\u043d\u0438\u043a\u0438 \u043f\u0440\u0430\u0432\u0438\u043b 2014 \u0433\u043e\u0434\u0430. \u041d\u0443\u0436\u043d\u044b \u043c\u043e\u043d\u0441\u0442\u0440\u044b, \u0437\u0430\u043a\u043b\u0438\u043d\u0430\u043d\u0438\u044f, \u043a\u043b\u0430\u0441\u0441\u044b, \u043f\u043e\u0434\u043a\u043b\u0430\u0441\u0441\u044b \u0438 \u043e\u0441\u043e\u0431\u0435\u043d\u043d\u043e\u0441\u0442\u0438. \u0412\u0441\u0442\u0440\u043e\u0435\u043d\u043d\u044b\u0435 \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u044b \u043c\u043e\u043d\u0441\u0442\u0440\u043e\u0432 \u0441\u043e\u0445\u0440\u0430\u043d\u044f\u044e\u0442\u0441\u044f \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e.</p><p>\u0414\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b \u043c\u0438\u0440\u0430 \u0438 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u0436\u0438 \u0438\u0433\u0440\u043e\u043a\u043e\u0432 \u043d\u0435 \u044d\u043a\u0441\u043f\u043e\u0440\u0442\u0438\u0440\u0443\u044e\u0442\u0441\u044f. \u0424\u0430\u0439\u043b \u0431\u0443\u0434\u0435\u0442 \u0441\u043a\u0430\u0447\u0430\u043d \u043d\u0430 \u0432\u0430\u0448 \u043a\u043e\u043c\u043f\u044c\u044e\u0442\u0435\u0440.</p><div style="display:grid;gap:7px">'+packs.map((p,i)=>'<label style="display:flex;gap:8px;align-items:start"><input type="checkbox" data-pack-index="'+i+'" '+(preferred(p)?'checked':'')+'><span>'+escape(p.metadata?.label||p.collection)+' <small style="opacity:.7">['+escape(p.collection)+'] '+escape(p.documentName)+'</small></span></label>').join('')+'</div><div style="display:flex;gap:12px;margin-top:20px"><button type="button" data-start>\u0421\u043a\u0430\u0447\u0430\u0442\u044c JSON</button><button type="button" data-cancel>\u041e\u0442\u043c\u0435\u043d\u0430</button></div>';
    document.body.appendChild(panel);
    let done=false;
    const finish=value=>{if(done)return;done=true;panel.close();panel.remove();resolve(value);};
    panel.querySelector('[data-start]').onclick=()=>{const indices=Array.from(panel.querySelectorAll('input:checked')).map(x=>Number(x.dataset.packIndex));if(!indices.length)return ui.notifications.warn('\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u0441\u0431\u043e\u0440\u043d\u0438\u043a.');finish(indices.map(i=>packs[i]));};
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
  ui.notifications.info('\u041d\u0430\u0447\u0430\u0442 \u044d\u043a\u0441\u043f\u043e\u0440\u0442. \u0414\u043e\u0436\u0434\u0438\u0442\u0435\u0441\u044c \u0441\u043a\u0430\u0447\u0438\u0432\u0430\u043d\u0438\u044f JSON; \u043d\u0435 \u0437\u0430\u043a\u0440\u044b\u0432\u0430\u0439\u0442\u0435 \u0432\u043a\u043b\u0430\u0434\u043a\u0443.');
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
  if (!records.length) return ui.notifications.error('\u041d\u0438\u0447\u0435\u0433\u043e \u043d\u0435 \u0432\u044b\u0433\u0440\u0443\u0436\u0435\u043d\u043e. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435 \u0441\u0431\u043e\u0440\u043d\u0438\u043a\u0438 \u0438 \u043f\u0440\u0430\u0432\u0430 \u0434\u043e\u0441\u0442\u0443\u043f\u0430.');
  // Keep each part below 24 MiB so files can be uploaded to the chat.
  const encoder=new TextEncoder(),limit=23*1024*1024,chunks=[];
  let chunk=[],size=0;
  for(const record of records){const bytes=encoder.encode(JSON.stringify(record)).length;if(chunk.length && size+bytes>limit){chunks.push(chunk);chunk=[];size=0;}chunk.push(record);size+=bytes;}
  if(chunk.length)chunks.push(chunk);
  const stamp=manifest.exportedAt.replace(/[:.]/g,'-');
  const files=chunks.map((records,i)=>({
    name:'tracker-foundry-full-'+stamp+(chunks.length>1?'-part-'+(i+1):'')+'.json',
    data:JSON.stringify({...manifest,part:i+1,parts:chunks.length,records})
  }));
  // Retain completed files for retry without reading the compendiums again.
  globalThis.trackerFoundryExportFiles=files;
  const saveFile=file=>{
    const save=globalThis.foundry?.utils?.saveDataToFile ?? globalThis.saveDataToFile;
    if(save)return save(file.data,'application/json',file.name);
    const blob=new Blob([file.data],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download=file.name;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
  };
  // Explicit clicks avoid automatic multi-download blocking and provide retry.
  const result=document.createElement('dialog');
  result.style.cssText='width:min(650px,90vw);max-height:85vh;padding:24px;background:#18212c;color:#eee;border:1px solid #7e8b98;border-radius:12px;overflow:auto';
  result.innerHTML='<h2>\u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u0441\u043e\u0431\u0440\u0430\u043d</h2><p>\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043a\u0430\u0436\u0434\u0443\u044e \u043a\u043d\u043e\u043f\u043a\u0443 \u0438 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043c\u0435\u0441\u0442\u043e \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u044f. \u0415\u0441\u043b\u0438 \u0444\u0430\u0439\u043b \u043d\u0435 \u043f\u043e\u044f\u0432\u0438\u043b\u0441\u044f, \u043a\u043d\u043e\u043f\u043a\u0443 \u043c\u043e\u0436\u043d\u043e \u043d\u0430\u0436\u0430\u0442\u044c \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e.</p>'+files.map((f,i)=>'<p><button type="button" data-file="'+i+'">\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0447\u0430\u0441\u0442\u044c '+(i+1)+' \u0438\u0437 '+files.length+'</button> <small>'+Math.ceil(new TextEncoder().encode(f.data).length/1024/1024)+' \u041c\u0411</small></p>').join('')+'<button type="button" data-close>\u0417\u0430\u043a\u0440\u044b\u0442\u044c</button>';
  document.body.appendChild(result);
  files.forEach((file,i)=>{result.querySelector('[data-file="'+i+'"]').onclick=()=>{try{saveFile(file);}catch(error){ui.notifications.error(String(error.message||error));console.error(error);}};});
  result.querySelector('[data-close]').onclick=()=>{result.close();result.remove();};
  result.showModal();
  console.info('Tracker export manifest',manifest);
  const summary='\u042d\u043a\u0441\u043f\u043e\u0440\u0442 \u0433\u043e\u0442\u043e\u0432: '+manifest.coverage.actors+' \u043c\u043e\u043d\u0441\u0442\u0440\u043e\u0432, '+manifest.coverage.items+' \u043f\u0440\u0435\u0434\u043c\u0435\u0442\u043e\u0432; \u0444\u0430\u0439\u043b\u043e\u0432: '+chunks.length+'.';
  if(manifest.errors.length)ui.notifications.warn(summary+' \u041d\u0435 \u043f\u0440\u043e\u0447\u0438\u0442\u0430\u043d\u044b \u0441\u0431\u043e\u0440\u043d\u0438\u043a\u0438: '+manifest.errors.map(e=>e.pack).join(', '));else ui.notifications.info(summary);
})();
