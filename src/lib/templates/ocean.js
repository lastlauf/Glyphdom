function lerpColor(a, b, t) {
  const ar=parseInt(a.slice(1,3),16),ag=parseInt(a.slice(3,5),16),ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16),bg=parseInt(b.slice(3,5),16),bb=parseInt(b.slice(5,7),16);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}
function createInstance() {
  const s = { time: 0 };
  return {
    init(canvas, params, colors) { s.time = 0; },
    update(dt, params) { s.time += dt * params.speed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg; ctx.fillRect(0,0,width,height);
      const cols=Math.floor(width/charW), rows=Math.floor(height/charH);
      ctx.font=`400 ${charH-3}px "JetBrains Mono", monospace`; ctx.textAlign='center';
      const horizon=Math.floor(rows*params.horizon);
      for (let row=0; row<rows; row++) {
        for (let col=0; col<cols; col++) {
          const depth=row-horizon; if (depth<0) continue;
          const wave=Math.sin(col*0.2+s.time*2+depth*0.3)*params.waveHeight;
          const wave2=Math.sin(col*0.35-s.time*1.3+depth*0.15)*params.waveHeight*0.5;
          const val=(wave+wave2)*0.5+0.5;
          const depthFade=Math.min(1,depth/(rows-horizon));
          let ch; if (val>0.75&&Math.random()<params.foamDensity) ch='~';
          else if (val>0.6) ch='≈'; else if (val>0.4) ch='-'; else if (val>0.2) ch='_'; else ch=' ';
          if (ch===' ') continue;
          ctx.fillStyle=lerpColor(colors.primary,colors.secondary,depthFade);
          ctx.fillText(ch,col*charW+charW/2,row*charH+charH-3);
        }
      }
    },
    destroy() {},
  };
}
export default {
  name:'Ocean', description:'Deep wave patterns',
  params:{ waveHeight:{min:0.1,max:1,default:0.5,label:'Wave Height',step:0.05}, speed:{min:0.1,max:3,default:0.8,label:'Speed',step:0.05}, foamDensity:{min:0,max:1,default:0.4,label:'Foam',step:0.05}, horizon:{min:0.2,max:0.8,default:0.45,label:'Horizon',step:0.05} },
  colors:{bg:'#040C14',primary:'#1E90FF',secondary:'#00CED1',glow:'#87CEEB'},
  createInstance,
};
