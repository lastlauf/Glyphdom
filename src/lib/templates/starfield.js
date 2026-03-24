// Starfield — factory pattern
const STAR_CHARS = ['.', '·', '+', '*', '✦', '★', '✧', '◦'];

function hexToRgb(hex) {
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
function lerpColor(a, b, t) {
  const ar=parseInt(a.slice(1,3),16), ag=parseInt(a.slice(3,5),16), ab=parseInt(a.slice(5,7),16);
  const br=parseInt(b.slice(1,3),16), bg=parseInt(b.slice(3,5),16), bb=parseInt(b.slice(5,7),16);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}

function newStar(spread = false) {
  const z = spread ? Math.random() : 1;
  return { x:(Math.random()-0.5)*2, y:(Math.random()-0.5)*2, z, pz:z, layer:Math.floor(Math.random()*3), charIdx:Math.floor(Math.random()*STAR_CHARS.length) };
}

function createInstance() {
  const s = { stars: [], w: 0, h: 0, time: 0 };
  return {
    init(canvas, params) {
      s.w = canvas.width; s.h = canvas.height; s.time = 0;
      s.stars = Array.from({ length: params.starCount }, () => newStar(true));
    },
    update(dt, params) {
      s.time += dt;
      while (s.stars.length < params.starCount) s.stars.push(newStar(false));
      while (s.stars.length > params.starCount) s.stars.pop();
      for (const star of s.stars) {
        star.pz = star.z;
        star.z -= dt * params.speed * (1 + star.layer * 0.3);
        if (star.z <= 0 || star.z > 1) { Object.assign(star, newStar(false)); star.z = 1; star.pz = 1; }
      }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, width, height);
      const cx = width/2, cy = height/2;
      ctx.textAlign = 'center';
      for (const star of s.stars) {
        const sx = (star.x/star.z)*cx+cx, sy = (star.y/star.z)*cy+cy;
        const px = (star.x/star.pz)*cx+cx, py = (star.y/star.pz)*cy+cy;
        if (sx<0||sx>width||sy<0||sy>height) continue;
        const col = Math.floor(sx/charW), row = Math.floor(sy/charH);
        const x = col*charW+charW/2, y = row*charH+charH-3;
        const brightness = Math.min(1, (1-star.z)*1.5);
        const size = brightness<0.3 ? 0 : brightness<0.6 ? 1 : brightness<0.85 ? 2 : 3;
        const ch = STAR_CHARS[Math.min(size, STAR_CHARS.length-1)];
        if (params.trailLength > 0 && brightness > 0.4) {
          const dx=sx-px, dy=sy-py, dist=Math.sqrt(dx*dx+dy*dy);
          if (dist > 1) {
            const steps = Math.min(Math.floor(brightness*params.trailLength), 15);
            ctx.font = `400 ${charH-4}px "JetBrains Mono", monospace`;
            for (let t=1; t<=steps; t++) {
              const frac=t/steps, tc=Math.floor((sx-dx*frac)/charW), tr=Math.floor((sy-dy*frac)/charH);
              ctx.fillStyle = `rgba(${hexToRgb(colors.secondary)},${(1-frac)*brightness*0.7})`;
              ctx.fillText('·', tc*charW+charW/2, tr*charH+charH-3);
            }
          }
        }
        const fontSize = charH-4+size*2;
        ctx.font = `${size>2?700:400} ${fontSize}px "JetBrains Mono", monospace`;
        if (brightness > 0.7) { ctx.fillStyle = colors.primary;   }
        else if (brightness > 0.4) { ctx.fillStyle = lerpColor(colors.secondary, colors.primary, (brightness-0.4)/0.3);  }
        else { ctx.fillStyle = `rgba(${hexToRgb(colors.secondary)},${brightness*2})`;  }
        ctx.fillText(ch, x, y);
      }
      
    },
    destroy() { s.stars = []; },
  };
}

export default {
  name: 'Starfield',
  description: 'Stars rushing toward you',
  params: {
    starCount:   { min: 50,  max: 500, default: 200, label: 'Star Count',   step: 10  },
    speed:       { min: 0.5, max: 5,   default: 2.0, label: 'Warp Speed',   step: 0.1 },
    trailLength: { min: 0,   max: 20,  default: 8,   label: 'Trail Length', step: 1   },
    depth:       { min: 0.5, max: 3,   default: 1.5, label: 'Depth Layers', step: 0.1 },
  },
  colors: { bg: '#0A0A0B', primary: '#FFFFFF', secondary: '#4488FF', glow: '#88AAFF' },
  createInstance,
};
