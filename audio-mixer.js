/* One Audio element per track; the existing IndexedDB library is never migrated. */
(function(root){'use strict';
class AudioMixer{
 constructor({createAudio=()=>new Audio(),createURL=b=>URL.createObjectURL(b),revokeURL=u=>URL.revokeObjectURL(u),volume=()=>1,loop=()=>false,gain=()=>1,onChange=()=>{},onTick=()=>{},onEnded=()=>{}}={}){Object.assign(this,{createAudio,createURL,revokeURL,volume,loop,gain,onChange,onTick,onEnded});this.entries=new Map();}
 async toggle(track){let entry=this.entries.get(track.id);if(!entry){const audio=this.createAudio(),url=this.createURL(track.blob);entry={id:track.id,kind:track.kind,audio,url,gain:this.gain(track.id)};this.entries.set(track.id,entry);audio.src=url;audio.loop=this.loop(track);audio.volume=Math.min(1,Math.max(0,this.volume(track.kind)*entry.gain));audio.onplay=audio.onpause=()=>this.onChange();audio.onloadedmetadata=audio.ontimeupdate=()=>this.onTick(entry);audio.onended=()=>{this.onChange();this.onEnded(entry);};audio.onerror=()=>this.onChange(Error('Не удалось прочитать аудиофайл. Попробуйте MP3, OGG или WAV.'));}const a=entry.audio;if(a.paused){if(a.ended)a.currentTime=0;await a.play();}else a.pause();this.onChange();return entry;}
 setVolume(kind,value){for(const e of this.entries.values())if(e.kind===kind)e.audio.volume=Math.min(1,Math.max(0,value*e.gain));}
 setGain(id,value){const e=this.entries.get(id);if(!e)return;e.gain=value;e.audio.volume=Math.min(1,Math.max(0,this.volume(e.kind)*value));}
 stop(id){const e=this.entries.get(id);if(e){e.audio.pause();e.audio.currentTime=0;this.onTick(e);this.onChange();}}
 stopAll(){for(const id of this.entries.keys())this.stop(id);}
 remove(id){const e=this.entries.get(id);if(!e)return;e.audio.pause();e.audio.removeAttribute('src');e.audio.load();this.revokeURL(e.url);this.entries.delete(id);this.onChange();}
 dispose(){for(const id of [...this.entries.keys()])this.remove(id);}
}
function updateMetadata(db,id,patch){return new Promise((resolve,reject)=>{const transaction=db.transaction('tracks','readwrite'),store=transaction.objectStore('tracks'),request=store.get(id);let updated;request.onsuccess=()=>{if(!request.result){transaction.abort();return;}updated={...request.result};if(Object.hasOwn(patch,'name'))updated.name=String(patch.name).trim();if(Object.hasOwn(patch,'folder'))updated.folder=String(patch.folder);store.put(updated);};transaction.oncomplete=()=>resolve(updated);transaction.onerror=()=>reject(transaction.error);transaction.onabort=()=>reject(transaction.error||Error('Запись не найдена'));});}
root.AudioMixer=AudioMixer;root.AudioLibrary={updateMetadata};if(typeof module!=='undefined'&&module.exports)module.exports={AudioMixer,updateMetadata};
})(typeof globalThis!=='undefined'?globalThis:window);
