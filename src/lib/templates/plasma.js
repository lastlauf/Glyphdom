const PLASMA_CHARS = ' .\'`^":;-~+*!|xX#%@$&';
function createInstance() {
  const s = { time: 0 };
  return {
    init(canvas, params, colors) { s.time = 0; },
    update(dt, params) { s.time += dt * params.speed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg; ctx.fillRect(0,0,width,height);
      const cols=Math.floor(width/charW), rows=Math.floor(height/charH);
      ctx.font=`400 ${charH-3}px "JetBrains Mono", monospace`; ctx.textAlign='center';
      const t=s.time;
      for (let row=0; row<rows; row++) {
        for (let col=0; col<cols; col++) {
          const nx=col/cols, ny=row/rows;
          const v1=Math.sin(nx*params.frequency*6+t);
          const v2=Math.sin(ny*params.frequency*6-t*0.7);
          const v3=Math.sin((nx+ny)*params.frequency*4+t*0.5);
          const v4=Math.sin(Math.sqrt((nx-0.5)**2+(ny-0.5)**2)*params.frequency*8-t);
          const v=(v1+v2+v3+v4*params.amplitude)/4;
          const norm=v*0.5+0.5;
          const idx=Math.floor(norm*(PLASMA_CHARS.length-1));
          const ch=PLASMA_CHARS[idx]; if (ch===' ') continue;
          const hue=(norm*360+params.palette*90+t*30)%360;
          ctx.fillStyle=`hsl(${hue},100%,${40+norm*40}%)`;
          ctx.fillText(ch,col*charW+charW/2,row*charH+charH-3);
        }
      }
    },
    destroy() {},
  };
}
export default {
  name:'Plasma', description:'Demoscene plasma waves',
  params:{ frequency:{min:0.5,max:5,default:2.0,label:'Frequency',step:0.1}, amplitude:{min:0.1,max:2,default:1.0,label:'Amplitude',step:0.05}, speed:{min:0.1,max:3,default:0.8,label:'Speed',step:0.05}, palette:{min:0,max:3,default:0,label:'Palette Shift',step:1} },
  colors:{bg:'#0A0A0B',primary:'#FF00FF',secondary:'#00FFFF',glow:'#FF88FF'},
  createInstance,
};
