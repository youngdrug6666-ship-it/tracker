/* Portal rim adapted from Binbun's Portal VFX (CC0).
 * https://binbun3d.itch.io/godot-portal-vfx
 * Retains layered noise/overlay shaping; uses a rounded-box distance field
 * and procedural noise instead of Godot's scene textures and 3D parallax.
 */
(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {alpha:true, premultipliedAlpha:true, antialias:false, depth:false, stencil:false, preserveDrawingBuffer:false});
  let frame=0, host=null, program=null, sizeLocation, timeLocation, last=0, lost=false;
  const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.0,1.0);}`;
  const fragment = `
    precision highp float;
    uniform vec2 resolution;
    uniform float clock;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0)),f.x),f.y);
    }
    float fbm(vec2 p){
      float n=0.0,a=0.55;
      for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(7.1,3.4);a*=0.5;}
      return n;
    }
    float overlay(float a,float b){return mix(2.0*a*b,1.0-2.0*(1.0-a)*(1.0-b),step(0.5,a));}
    float boxDistance(vec2 p,vec2 halfSize,float radius){
      vec2 q=abs(p)-halfSize+radius;
      return length(max(q,0.0))+min(max(q.x,q.y),0.0)-radius;
    }
    void main(){
      // Coordinates in CSS pixels: thickness stays consistent on every screen.
      vec2 p=gl_FragCoord.xy/resolution*resolution-resolution*0.5;
      vec2 halfSize=resolution*0.5-vec2(22.0);
      float distance=boxDistance(p,halfSize,24.0);
      // Empty centre. Border texture never covers the character controls.
      if(distance < -2.5 || distance > 21.0){gl_FragColor=vec4(0.0);return;}
      vec2 pos=p*0.055;
      vec2 drift=vec2(clock*0.16,-clock*0.32);
      vec2 warp=vec2(fbm(pos+drift),fbm(pos+vec2(23.7,9.2)-drift*0.7));
      float field=0.0;
      // Binbun's layer/fade and overlay approach, adapted to a narrow rim.
      for(int i=0;i<4;i++){
        float depth=float(i)/4.0;
        vec2 uv=pos+warp*1.65+vec2(depth*7.0,depth*3.0)+drift*(1.0+depth);
        float n=fbm(uv);
        float shape=clamp(1.0-max(distance-2.0+(warp.x-0.5)*7.0,0.0)/(14.0+depth*10.0),0.0,1.0);
        float energy=overlay(shape,n);
        float layer=smoothstep(0.38,0.76,energy)*(1.0-depth*0.55);
        field=max(field,layer);
      }
      float n=fbm(pos*2.0+warp*2.5+drift*1.8);
      // Break up the outer silhouette into flowing, translucent wisps.
      float extent=3.0+25.0*pow(fbm(pos+warp*2.0+drift),1.15);
      float tip=1.0-smoothstep(extent-4.0,extent+1.0,distance);
      float inner=smoothstep(-2.5,-0.5,distance);
      float body=field*tip*inner*(0.55+0.45*smoothstep(0.25,0.7,n));
      float core=exp(-abs(distance-0.6)*0.7)*(0.45+0.55*n)*inner;
      float halo=exp(-max(distance,0.0)*0.17)*0.16*inner;
      float alpha=clamp(body*0.85+core*0.35+halo,0.0,0.92);
      vec3 color=mix(vec3(0.30,0.045,0.62),vec3(0.65,0.24,0.98),smoothstep(0.0,0.75,body));
      color=mix(color,vec3(0.94,0.73,1.0),clamp(core*0.95+pow(body,4.0)*0.35,0.0,0.85));
      gl_FragColor=vec4(color*alpha,alpha);
    }`;
  function compile(type,source){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(error);}
    return shader;
  }
  function setup(){
    if(!gl)return false;
    try{
      const v=compile(gl.VERTEX_SHADER,vertex), f=compile(gl.FRAGMENT_SHADER,fragment);
      program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
      gl.deleteShader(v);gl.deleteShader(f);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      sizeLocation=gl.getUniformLocation(program,'resolution');timeLocation=gl.getUniformLocation(program,'clock');
      return true;
    }catch(error){console.warn('Эффект портала недоступен:',error.message);return false;}
  }
  let ready=setup();
  function draw(now){
    frame=0;
    if(!ready || lost || !host?.isConnected || document.hidden)return;
    if(!motion.matches && now-last<1000/40){frame=requestAnimationFrame(draw);return;}
    last=now;
    const rect=host.getBoundingClientRect();
    // Render at CSS resolution to keep a single active effect inexpensive.
    const w=Math.round(rect.width),h=Math.round(rect.height);
    if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.uniform2f(sizeLocation,w,h);gl.uniform1f(timeLocation,motion.matches?0:now/1000);
    gl.drawArrays(gl.TRIANGLES,0,6);
    if(!motion.matches)frame=requestAnimationFrame(draw);
  }
  function sync(){
    const next=document.querySelector('.turn-flames');
    if(next===host)return;
    cancelAnimationFrame(frame);frame=0;host=next;
    // One GPU context is reused across turns and all card redraws.
    if(host && ready){host.append(canvas);frame=requestAnimationFrame(draw);}else canvas.remove();
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;ready=setup();if(ready && host)frame=requestAnimationFrame(draw);});
  new MutationObserver(sync).observe(document.getElementById('combatantsGrid') || document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);if(!document.hidden)frame=requestAnimationFrame(draw);});
  motion.addEventListener('change',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);});
  window.addEventListener('resize',()=>{if(motion.matches){cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);}});
  sync();
})();
