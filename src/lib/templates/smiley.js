// 3D Rotating Smiley Face

function buildSmileyPoints() {
  const pts = [];
  // Face sphere
  for (let lat = 0; lat <= Math.PI; lat += 0.15) {
    for (let lon = 0; lon < Math.PI * 2; lon += 0.18) {
      pts.push({ x: Math.sin(lat)*Math.cos(lon), y: Math.cos(lat), z: Math.sin(lat)*Math.sin(lon), type: 'face' });
    }
  }
  // Left eye
  for (let a = 0; a < Math.PI * 2; a += 0.4) {
    pts.push({ x: -0.35+Math.cos(a)*0.15, y: 0.25+Math.sin(a)*0.15, z: 0.92, type: 'eye' });
  }
  pts.push({ x: -0.35, y: 0.25, z: 0.95, type: 'pupil' });
  // Right eye
  for (let a = 0; a < Math.PI * 2; a += 0.4) {
    pts.push({ x: 0.35+Math.cos(a)*0.15, y: 0.25+Math.sin(a)*0.15, z: 0.92, type: 'eye' });
  }
  pts.push({ x: 0.35, y: 0.25, z: 0.95, type: 'pupil' });
  // Smile arc
  for (let a = Math.PI * 0.1; a <= Math.PI * 0.9; a += 0.12) {
    const r = 0.5;
    pts.push({ x: Math.cos(a)*r, y: -0.15 + Math.sin(a)*(-0.25), z: 0.85, type: 'smile' });
  }
  // Cheek blush circles
  for (let a = 0; a < Math.PI * 2; a += 0.45) {
    pts.push({ x: -0.6+Math.cos(a)*0.12, y: 0.0+Math.sin(a)*0.08, z: 0.78, type: 'blush' });
    pts.push({ x:  0.6+Math.cos(a)*0.12, y: 0.0+Math.sin(a)*0.08, z: 0.78, type: 'blush' });
  }
  return pts;
}

const SMILEY_POINTS = buildSmileyPoints();

function project(x, y, z, cx, cy, fov) {
  const sc = fov / (fov + z);
  return { sx: cx + x*sc*cx*0.8, sy: cy - y*sc*cy*0.85, sc };
}

function createInstance() {
  const s = { time: 0 };
  return {
    init(canvas, params, colors) { s.time = 0; },
    update(dt, params) { s.time += dt * params.rotateSpeed; },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg; ctx.fillRect(0,0,width,height);
      const cx=width/2, cy=height/2;
      const fov = Math.min(width,height)*0.9;
      const t = s.time;
      const cosY=Math.cos(t), sinY=Math.sin(t);
      const tilt = Math.sin(t*0.5)*0.2;
      const cosX=Math.cos(tilt), sinX=Math.sin(tilt);
      const scale = params.scale;

      const projected = [];
      for (const pt of SMILEY_POINTS) {
        const rx = pt.x*cosY - pt.z*sinY;
        const rz0 = pt.x*sinY + pt.z*cosY;
        const ry = pt.y*cosX - rz0*sinX;
        const rz = pt.y*sinX + rz0*cosX;
        const {sx,sy} = project(rx*scale, ry*scale, rz*scale*0.5, cx, cy, fov);
        const depth = (rz+1.5)/3;
        projected.push({sx,sy,depth,type:pt.type});
      }
      projected.sort((a,b)=>a.depth-b.depth);

      ctx.font=`700 ${charH-2}px "JetBrains Mono", monospace`;
      ctx.textAlign='center';

      for (const {sx,sy,depth,type} of projected) {
        if (sx<0||sx>width||sy<0||sy>height) continue;
        const col=Math.floor(sx/charW), row=Math.floor(sy/charH);
        const dx=col*charW+charW/2, dy=row*charH+charH-2;
        let ch, color;
        if (type==='pupil') { ch='●'; color='#111'; }
        else if (type==='eye') { ch='○'; color='#111'; }
        else if (type==='smile') { ch='▄'; color='#111'; }
        else if (type==='blush') { ch='♥'; color=colors.glow; }
        else {
          // face surface
          const t2=Math.max(0,Math.min(1,(depth-0.2)/0.7));
          if (depth>0.82) ch='█';
          else if (depth>0.65) ch='▓';
          else if (depth>0.48) ch='▒';
          else if (depth>0.32) ch='░';
          else ch='.';
          color=lerpColor(colors.secondary, colors.primary, t2);
        }
        ctx.fillStyle=color;
        ctx.fillText(ch,dx,dy);
      }
    },
    destroy() {},
  };
}

function lerpColor(a,b,t){
  const ar=parseInt(a.slice(1,3),16),ag=parseInt(a.slice(3,5),16),ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16),bg=parseInt(b.slice(3,5),16),bb=parseInt(b.slice(5,7),16);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}

export default {
  name: 'Smiley',
  description: '3D rotating smiley',
  params: {
    rotateSpeed: { min: 0.1, max: 3,  default: 0.7, label: 'Rotate Speed', step: 0.05 },
    scale:       { min: 0.5, max: 2,  default: 1.0, label: 'Scale',        step: 0.05 },
    glow:        { min: 0,   max: 1,  default: 0.6, label: 'Glow',         step: 0.05 },
  },
  colors: { bg: '#0A0A0B', primary: '#FFD700', secondary: '#AA8800', glow: '#FFEE44' },
  createInstance,
};
