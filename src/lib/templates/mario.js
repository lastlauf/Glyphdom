// Super Mario running — side-scrolling ASCII scene

// Mario sprite frames (8x8 chars, 4 run frames)
const MARIO_FRAMES = [
  // Frame 0 — stand / right foot
  [
    ' _M_  ',
    '(o o) ',
    ' |█|  ',
    '/█|█\\ ',
    ' | |  ',
    '_/ \\_ ',
  ],
  // Frame 1 — right step
  [
    ' _M_  ',
    '(o o) ',
    ' |█|  ',
    '/█|█\\ ',
    '  |/  ',
    '_/    ',
  ],
  // Frame 2 — both feet
  [
    ' _M_  ',
    '(o o) ',
    ' |█|  ',
    '/█|█\\ ',
    ' /\\   ',
    '/  \\  ',
  ],
  // Frame 3 — left step
  [
    ' _M_  ',
    '(o o) ',
    ' |█|  ',
    '/█|█\\ ',
    ' \\|   ',
    '   \\_ ',
  ],
];

// Ground tiles
const GROUND_CHARS = ['▓','▓','░','▒','▓','░'];
const CLOUD_CHARS  = ['(',')','~','~','~'];

function buildClouds(cols) {
  return Array.from({length:4}, (_,i) => ({
    x: (i * cols * 0.28 + Math.random() * cols * 0.1) % cols,
    y: 2 + Math.floor(Math.random() * 4),
    w: 6 + Math.floor(Math.random() * 8),
  }));
}
function buildPipes(cols) {
  return Array.from({length:3}, (_,i) => ({
    x: cols * 0.3 + i * cols * 0.3 + Math.random() * 10,
    h: 4 + Math.floor(Math.random() * 4),
  }));
}

function createInstance() {
  const s = {
    time: 0, marioX: 0, marioFrame: 0, frameTick: 0,
    scroll: 0, cols: 0, rows: 0,
    clouds: [], pipes: [], coins: [],
  };

  return {
    init(canvas, params, colors) {
      s.time = 0; s.scroll = 0; s.frameTick = 0; s.marioFrame = 0;
      s.cols = Math.floor(canvas.width / 12);
      s.rows = Math.floor(canvas.height / 18);
      s.marioX = Math.floor(s.cols * 0.2);
      s.clouds = buildClouds(s.cols);
      s.pipes = buildPipes(s.cols);
      s.coins = Array.from({length:6}, (_,i) => ({
        x: s.cols*0.3 + i*s.cols*0.12,
        y: s.rows - 8,
        collected: false, bobOffset: i * 0.8,
      }));
    },
    update(dt, params) {
      s.time += dt * params.speed;
      s.scroll += dt * params.speed * 8;
      s.frameTick += dt * params.speed * 6;
      if (s.frameTick >= 1) { s.marioFrame = (s.marioFrame + 1) % 4; s.frameTick = 0; }
      // wrap coins
      for (const coin of s.coins) {
        if ((coin.x - s.scroll) < -2) { coin.x += s.cols * 0.8; coin.collected = false; }
      }
      // wrap pipes
      for (const pipe of s.pipes) {
        if ((pipe.x - s.scroll) < -4) { pipe.x += s.cols * 0.9 + Math.random() * 15; }
      }
      // wrap clouds
      for (const cloud of s.clouds) {
        if ((cloud.x - s.scroll * 0.3) < -cloud.w) { cloud.x += s.cols * 1.1; }
      }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      const cw = 12, ch = 18;
      ctx.fillStyle = colors.bg; ctx.fillRect(0,0,width,height);
      const cols = Math.floor(width/cw), rows = Math.floor(height/ch);
      const groundRow = rows - 4;
      ctx.textAlign = 'center';

      // Sky gradient hint
      ctx.fillStyle = colors.secondary + '22';
      ctx.fillRect(0, 0, width, groundRow*ch);

      // Clouds
      ctx.font = `400 ${ch-4}px "JetBrains Mono", monospace`;
      for (const cloud of s.clouds) {
        const cx = Math.round(cloud.x - s.scroll * 0.3);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i=0; i<cloud.w; i++) {
          const col = cx + i;
          if (col < 0 || col >= cols) continue;
          ctx.fillText(i===0?'(':i===cloud.w-1?')':'~', col*cw+cw/2, cloud.y*ch);
        }
      }

      // Pipes
      ctx.font = `700 ${ch-2}px "JetBrains Mono", monospace`;
      for (const pipe of s.pipes) {
        const px = Math.round(pipe.x - s.scroll);
        if (px < 0 || px >= cols-1) continue;
        // pipe top cap
        ctx.fillStyle = colors.primary;
         
        ctx.fillText('╔', px*cw+cw/2, (groundRow-pipe.h)*ch);
        ctx.fillText('╗', (px+1)*cw+cw/2, (groundRow-pipe.h)*ch);
        
        // pipe body
        ctx.fillStyle = colors.secondary;
        for (let r=groundRow-pipe.h+1; r<groundRow; r++) {
          ctx.fillText('║', px*cw+cw/2, r*ch+ch-2);
          ctx.fillText('║', (px+1)*cw+cw/2, r*ch+ch-2);
        }
      }

      // Coins
      ctx.font = `700 ${ch-3}px "JetBrains Mono", monospace`;
      for (const coin of s.coins) {
        if (coin.collected) continue;
        const cx = Math.round(coin.x - s.scroll);
        if (cx<0||cx>=cols) continue;
        const bob = Math.sin(s.time * 3 + coin.bobOffset) * 0.5;
        const cy = coin.y + Math.round(bob);
        if (cy<0||cy>=rows) continue;
        ctx.fillStyle = '#FFD700';
         
        ctx.fillText('◉', cx*cw+cw/2, cy*ch+ch-2);
      }
      

      // Ground
      ctx.font = `700 ${ch-2}px "JetBrains Mono", monospace`;
      for (let r=groundRow; r<rows; r++) {
        for (let c=0; c<cols; c++) {
          const gx = ((c + Math.floor(s.scroll)) % GROUND_CHARS.length + GROUND_CHARS.length) % GROUND_CHARS.length;
          ctx.fillStyle = r===groundRow ? colors.primary : colors.secondary;
          ctx.fillText(GROUND_CHARS[gx], c*cw+cw/2, r*ch+ch-2);
        }
      }

      // Mario
      ctx.font = `600 ${ch-4}px "JetBrains Mono", monospace`;
      const frame = MARIO_FRAMES[s.marioFrame];
      const marioCol = s.marioX;
      const marioRow = groundRow - frame.length;
      for (let r=0; r<frame.length; r++) {
        const line = frame[r];
        for (let c=0; c<line.length; c++) {
          const ch2 = line[c];
          if (ch2 === ' ') continue;
          const dc = marioCol + c - 2;
          if (dc<0||dc>=cols) continue;
          const dr = marioRow + r;
          if (dr<0||dr>=rows) continue;
          // color by char
          if (ch2 === '█' || ch2 === 'M') ctx.fillStyle = '#FF2020'; // red cap/shirt
          else if (ch2 === 'o') ctx.fillStyle = '#FFCC88'; // skin
          else ctx.fillStyle = colors.text || '#C08030'; // overalls
          ctx.fillText(ch2, dc*cw+cw/2, dr*ch+ch-2);
        }
      }
    },
    destroy() {},
  };
}

export default {
  name: 'Mario',
  description: 'Super Mario side-scroller',
  params: {
    speed:       { min: 0.2, max: 3,  default: 1.0, label: 'Run Speed',   step: 0.1 },
    cameraShake: { min: 0,   max: 1,  default: 0.2, label: 'Camera Shake',step: 0.05 },
  },
  colors: { bg: '#5C94FC', primary: '#00A800', secondary: '#006800', glow: '#FFFFFF' },
  createInstance,
};
