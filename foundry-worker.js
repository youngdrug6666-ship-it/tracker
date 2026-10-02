'use strict';
self.onmessage=async()=>{try{
 const manifest=await fetch('foundry-data.json?v=1').then(r=>{if(!r.ok)throw Error('База недоступна');return r.json();});
 const pieces=await Promise.all(manifest.files.map(p=>fetch(p+'?v='+manifest.version).then(r=>{if(!r.ok)throw Error('Часть базы недоступна');return r.text();})));
 const binary=atob(pieces.join('')),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 const data=JSON.parse(await new Response(stream).text());
 const [counts,aliases]=await Promise.all(['foundry-resources.json?v=1','spell-aliases.json?v=1'].map(p=>fetch(p).then(r=>r.ok?r.json():{}).catch(()=>({}))));
 for(const m of data.monsters)m.legendaryResistanceCount=counts[m.name]||0;
 self.postMessage({data,aliases});
}catch(error){self.postMessage({error:error.message});}};
