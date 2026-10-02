/* Continuous procedural fire: one clock survives card redraws, no video loop. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let canvas, ctx, frame = 0, width = 0, height = 0, last = 0;
  const margin = 13;
  function point(distance, w, h, r) {
    const straight = [w - 2*r, h - 2*r, w - 2*r, h - 2*r];
    const arc = Math.PI*r/2;
    const starts = [[r,0,1,0],[w,r,0,1],[w-r,h,-1,0],[0,h-r,0,-1]];
    const centers = [[w-r,r],[w-r,h-r],[r,h-r],[r,r]];
    for (let side=0; side<4; side++) {
      if (distance <= straight[side]) {
        const [x,y,dx,dy] = starts[side];
        return [x+dx*distance,y+dy*distance,dy,-dx];
      }
      distance -= straight[side];
      if (distance <= arc) {
        const angle = -Math.PI/2 + side*Math.PI/2 + distance/r;
        const [x,y] = centers[side];
        return [x+r*Math.cos(angle),y+r*Math.sin(angle),Math.cos(angle),Math.sin(angle)];
      }
      distance -= arc;
    }
    return [r,0,0,-1];
  }
  function draw(now) {
    frame = 0;
    if (!canvas?.isConnected || document.hidden) return;
    if (!motion.matches && now-last < 1000/45) { frame=requestAnimationFrame(draw); return; }
    last=now;
    const box=canvas.parentElement.getBoundingClientRect();
    const w=box.width, h=box.height, ratio=Math.min(devicePixelRatio || 1,1.5);
    if (width!==w || height!==h) {
      width=w; height=h;
      canvas.width=Math.ceil(w*ratio);canvas.height=Math.ceil(h*ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0);
    }
    ctx.clearRect(0,0,w,h);
    const cw=w-2*margin,ch=h-2*margin,r=Math.min(24,cw/2,ch/2);
    if(cw<=0 || ch<=0)return;
    const length=2*(cw+ch-4*r)+2*Math.PI*r, samples=Math.ceil(length/3);
    const time=motion.matches?0:now/1000;
    ctx.beginPath();
    for(let i=0;i<=samples;i++) {
      const s=i/samples, a=s*Math.PI*2;
      // Spatial harmonics meet exactly at the seam; time never resets.
      const wave=Math.sin(a*19-time*2.1)+.55*Math.sin(a*37+time*3.2)+.3*Math.sin(a*61-time*4.3);
      const flare=Math.pow(Math.max(0,Math.sin(a*13-time*1.6)),5)*3.5;
      const d=1.2+wave*1.65+flare;
      const [x,y,nx,ny]=point(s*length,cw,ch,r);
      const px=x+margin+nx*d,py=y+margin+ny*d;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.lineJoin='round';ctx.lineCap='round';
    ctx.shadowColor='#9b38ff';ctx.shadowBlur=10;ctx.strokeStyle='rgba(137,52,232,.32)';ctx.lineWidth=7;ctx.stroke();
    ctx.shadowBlur=5;ctx.strokeStyle='#b568f5';ctx.lineWidth=3.4;ctx.stroke();
    ctx.shadowBlur=2;ctx.strokeStyle='#efcfff';ctx.lineWidth=1.35;ctx.stroke();
    // Short curling tongues along the exterior, away from controls.
    ctx.shadowBlur=4;ctx.strokeStyle='rgba(211,149,255,.65)';ctx.lineWidth=1;
    for(let i=0;i<36;i++) {
      const s=i/36, pulse=(1+Math.sin(time*2.6+i*2.4))/2;
      const [x,y,nx,ny]=point(s*length,cw,ch,r), size=2+pulse*5;
      ctx.beginPath();ctx.moveTo(x+margin+nx*2,y+margin+ny*2);
      ctx.quadraticCurveTo(x+margin+nx*size-ny*3,y+margin+ny*size+nx*3,x+margin+nx*(size+1)+ny*2,y+margin+ny*(size+1)-nx*2);ctx.stroke();
    }
    if(!motion.matches)frame=requestAnimationFrame(draw);
  }
  function sync() {
    const host=document.querySelector('.turn-flames');
    if(host && canvas?.parentElement===host)return;
    cancelAnimationFrame(frame);frame=0;
    canvas?.remove();canvas=null;
    if(!host)return;
    canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');host.append(canvas);
    ctx=canvas.getContext('2d');width=height=0;
    frame=requestAnimationFrame(draw);
  }
  const observer=new MutationObserver(sync);
  observer.observe(document.getElementById('combatantsGrid') || document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);if(!document.hidden)frame=requestAnimationFrame(draw);});
  motion.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);});
  window.addEventListener('resize',()=>{if(motion.matches)frame=requestAnimationFrame(draw);});
  sync();
})();
