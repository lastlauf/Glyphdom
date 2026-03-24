function createInstance() {
  const s = { drops:[], splashes:[], cols:0, rows:0, time:0 };
  return {
    init(canvas, params, colors) {
      s.time=0; s.drops=[]; s.splashes=[];
      s.cols=Math.floor(canvas.width/10); s.rows=Math.floor(canvas.height/16);
      for (let i=0; i<s.cols*params.density*0.5; i++)
        s.drops.push({x:Math.random()*s.cols, y:Math.random()*s.rows, speed:0.5+Math.random()});
    },
    update(dt, params) {
      s.time+=dt;
      const angle=params.windAngle*Math.PI/180;
      const dx=Math.sin(angle)*params.speed*0.3, dy=Math.cos(angle)*params.speed;
      for (const d of s.drops) {
        d.x+=dx*dt*30; d.y+=dy*dt*30;
        if (d.y>=s.rows) {
          d.y=0; d.x=Math.random()*s.cols;
          if (Math.random()<0.3&&params.splashSize>0) s.splashes.push({x:d.x,y:s.rows-1,life:8,size:params.splashSize});
        }
      }
      s.splashes=s.splashes.filter(sp=>sp.life-->0);
    },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle=colors.bg; ctx.fillRect(0,0,width,height);
      const cw=10,ch=16;
      ctx.font=`400 12px "JetBrains Mono", monospace`; ctx.textAlign='center';
      for (const d of s.drops) { ctx.fillStyle=colors.primary; ctx.fillText('|',Math.floor(d.x)*cw+cw/2,Math.floor(d.y)*ch); }
      for (const sp of s.splashes) { ctx.globalAlpha=sp.life/8; ctx.fillStyle=colors.glow; ctx.fillText('*',Math.floor(sp.x)*cw+cw/2,Math.floor(sp.y)*ch); }
      ctx.globalAlpha=1;
    },
    destroy() { s.drops=[]; s.splashes=[]; },
  };
}
export default {
  name:'Rain', description:'Diagonal rain with splashes',
  params:{ density:{min:0.1,max:1,default:0.5,label:'Density',step:0.05}, windAngle:{min:-45,max:45,default:20,label:'Wind Angle',step:1}, splashSize:{min:0,max:5,default:2,label:'Splash Size',step:0.5}, speed:{min:0.5,max:3,default:1.5,label:'Speed',step:0.05} },
  colors:{bg:'#0D1117',primary:'#88BBDD',secondary:'#334455',glow:'#AACCEE'},
  createInstance,
};
