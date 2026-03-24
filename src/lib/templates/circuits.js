function createInstance() {
  const s = { grid:null, nodes:[], cols:0, rows:0, cw:12, ch:18, time:0 };
  return {
    init(canvas, params, colors) {
      s.time=0; s.cw=12; s.ch=18;
      s.cols=Math.floor(canvas.width/s.cw); s.rows=Math.floor(canvas.height/s.ch);
      s.grid=new Uint8Array(s.cols*s.rows).fill(0);
      s.nodes=[{x:Math.floor(s.cols/2),y:Math.floor(s.rows/2),dir:0,age:0}];
    },
    update(dt, params) {
      s.time+=dt;
      const {cols,rows,grid,nodes}=s;
      const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
      if (Math.random()<dt*params.growthSpeed*5) {
        for (let n=nodes.length-1;n>=0;n--) {
          const node=nodes[n]; node.age++;
          const [dx,dy]=DIRS[node.dir];
          const nx=node.x+dx, ny=node.y+dy;
          if (nx>=0&&nx<cols&&ny>=0&&ny<rows) {
            grid[ny*cols+nx]=node.dir+1; node.x=nx; node.y=ny;
            if (Math.random()<params.branchProb*0.1) nodes.push({x:nx,y:ny,dir:Math.floor(Math.random()*4),age:0});
          } else nodes.splice(n,1);
        }
        if (nodes.length<params.density*20) nodes.push({x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows),dir:Math.floor(Math.random()*4),age:0});
      }
      if (s.time>8) { s.grid.fill(0); s.time=0; s.nodes=[{x:Math.floor(cols/2),y:Math.floor(rows/2),dir:0,age:0}]; }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle=colors.bg; ctx.fillRect(0,0,width,height);
      const {cols,rows,grid,cw,ch}=s;
      ctx.font=`400 ${ch-3}px "JetBrains Mono", monospace`; ctx.textAlign='center';
      for (let row=0;row<rows;row++) {
        for (let col=0;col<cols;col++) {
          const v=grid[row*cols+col]; if (!v) continue;
          const isH=v===1||v===3;
          ctx.fillStyle=colors.primary;
          ctx.fillText(isH?'─':'│',col*cw+cw/2,row*ch+ch-2);
        }
      }
    },
    destroy() { s.grid=null; s.nodes=[]; },
  };
}
export default {
  name:'Circuits', description:'Growing circuit board patterns',
  params:{ growthSpeed:{min:0.1,max:3,default:1.0,label:'Growth Speed',step:0.1}, branchProb:{min:0.1,max:0.9,default:0.4,label:'Branching',step:0.05}, glowIntensity:{min:0,max:1,default:0.6,label:'Glow',step:0.05}, density:{min:0.1,max:1,default:0.5,label:'Density',step:0.05} },
  colors:{bg:'#0A0A0B',primary:'#00FFD0',secondary:'#006644',glow:'#00FFD0'},
  createInstance,
};
