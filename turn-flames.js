/* Continuous procedural fire: one clock survives card redraws, no video loop. */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let canvas, ctx, frame = 0, width = 0, height = 0, last = 0;
  const margin = 22;
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
    // Filled, tapered flames instead of a stroked perimeter.
    const count=Math.ceil(length/7);
    ctx.globalCompositeOperation='source-over';
    for(let i=0;i<count;i++) {
      const phase=i*2.399963;
      const pulse=.5+.5*Math.sin(time*2.7+phase);
      const sway=Math.sin(time*3.3+phase)*3.5+Math.sin(time*1.4+i)*2;
      const tall=3+15*pulse*pulse*(.65+.35*Math.sin(i*7.13))+2*Math.sin(time*4.1+phase);
      const base=3.6+1.4*(.5+.5*Math.sin(time*2.1+phase));
      const distance=(i/count*length+2*Math.sin(time*1.5+phase)+length)%length;
      const [x,y,nx,ny]=point(distance,cw,ch,r);
      ctx.save();ctx.translate(x+margin,y+margin);
      // Local x follows the edge, local y points outwards.
      ctx.transform(-ny,nx,nx,ny,0,0);
      function tongue(scale,color,blur) {
        ctx.beginPath();
        ctx.moveTo(-base*scale,-1);
        ctx.bezierCurveTo(-base*1.5*scale,tall*.28*scale,sway-4*scale,tall*.65*scale,sway,tall*scale);
        ctx.bezierCurveTo(sway+1.7*scale,tall*.61*scale,base*1.6*scale,tall*.34*scale,base*scale,-1);
        ctx.quadraticCurveTo(0,-2,-base*scale,-1);
        ctx.closePath();ctx.fillStyle=color;ctx.shadowColor='#9b35ff';ctx.shadowBlur=blur;ctx.fill();
      }
      const halo=ctx.createLinearGradient(0,-2,0,tall);
      halo.addColorStop(0,'rgba(129,31,229,.55)');halo.addColorStop(.4,'rgba(157,52,246,.36)');halo.addColorStop(1,'rgba(120,34,230,0)');
      tongue(1.15,halo,7);
      const body=ctx.createLinearGradient(0,-1,0,tall);
      body.addColorStop(0,'rgba(217,157,255,.85)');body.addColorStop(.28,'rgba(185,94,255,.75)');body.addColorStop(.72,'rgba(146,47,238,.48)');body.addColorStop(1,'rgba(129,30,224,0)');
      tongue(1,body,2);
      const core=ctx.createLinearGradient(0,-1,0,tall*.6);
      core.addColorStop(0,'rgba(250,221,255,.88)');core.addColorStop(.35,'rgba(227,179,255,.65)');core.addColorStop(1,'rgba(194,123,255,0)');
      tongue(.36,core,0);
      ctx.restore();
    }
    ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;
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
