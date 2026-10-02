const assert=require('node:assert/strict'),{place}=require('../app-tooltips.js');
for(const width of [320,390,768,1366,1920])for(const r of [{left:0,top:0,bottom:30,width:40},{left:width-40,top:100,bottom:130,width:40},{left:width/2,top:740,bottom:770,width:40}]){const pos=place(r,Math.min(300,width-16),60,{width,height:800});assert(pos.left>=8);assert(pos.left+Math.min(300,width-16)<=width-8);assert(pos.top>=8);assert(pos.top+60<=792);}
console.log('PASS tooltip clamps all viewport edges at phone, tablet and desktop widths');
