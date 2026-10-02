(function(root){
'use strict';
function place(rect,width,height,viewport){const margin=8,gap=8;const left=Math.max(margin,Math.min(rect.left+(rect.width-width)/2,viewport.width-width-margin));let top=rect.bottom+gap;if(top+height>viewport.height-margin)top=rect.top-height-gap;return{left,top:Math.max(margin,Math.min(top,viewport.height-height-margin))};}
function init(){
 const tip=document.createElement('div');tip.id='appTooltip';tip.role='tooltip';tip.hidden=true;document.body.appendChild(tip);let active=null;
 const hide=()=>{if(active){const ids=(active.getAttribute('aria-describedby')||'').split(/\s+/).filter(x=>x&&x!==tip.id);if(ids.length)active.setAttribute('aria-describedby',ids.join(' '));else active.removeAttribute('aria-describedby');}active=null;tip.hidden=true;};
 const show=target=>{if(target===active)return;hide();if(!target||!target.dataset.tooltip)return;active=target;tip.textContent=target.dataset.tooltip;tip.hidden=false;tip.style.visibility='hidden';const rect=target.getBoundingClientRect();const pos=place(rect,tip.offsetWidth,tip.offsetHeight,{width:innerWidth,height:innerHeight});tip.style.left=pos.left+'px';tip.style.top=pos.top+'px';tip.style.visibility='visible';const ids=(target.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean);target.setAttribute('aria-describedby',[...new Set([...ids,tip.id])].join(' '));};
 document.addEventListener('mouseover',e=>show(e.target.closest('[data-tooltip]')));
 document.addEventListener('mouseout',e=>{if(active&&!active.contains(e.relatedTarget))hide();});
 document.addEventListener('focusin',e=>show(e.target.closest('[data-tooltip]')));
 document.addEventListener('focusout',hide);document.addEventListener('pointerdown',hide,true);document.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});
}
root.AppTooltips={place,init};if(typeof module!=='undefined')module.exports=root.AppTooltips;else init();
})(typeof window==='undefined'?globalThis:window);
