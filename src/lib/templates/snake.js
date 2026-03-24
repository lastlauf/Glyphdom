// Snake — factory pattern
function createInstance() {
  const s = { snake: [], dir: { x: 1, y: 0 }, food: null, cols: 0, rows: 0, time: 0, ticker: 0, growQueue: 0 };

  function placeFood() {
    for (let attempt = 0; attempt < 100; attempt++) {
      const x = Math.floor(Math.random() * s.cols);
      const y = Math.floor(Math.random() * s.rows);
      if (!s.snake.some(seg => seg.x === x && seg.y === y)) {
        s.food = { x, y };
        return;
      }
    }
    s.food = { x: Math.floor(s.cols / 2), y: 1 };
  }

  function resetSnake() {
    const cx = Math.floor(s.cols / 2), cy = Math.floor(s.rows / 2);
    s.snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    s.dir = { x: 1, y: 0 };
    s.growQueue = 0;
    placeFood();
  }

  return {
    init(canvas, params, colors) {
      s.cols = Math.floor(canvas.width / 14);
      s.rows = Math.floor(canvas.height / 20);
      s.time = 0;
      s.ticker = 0;
      resetSnake();
    },
    update(dt, params) {
      s.time += dt;
      s.ticker += dt * params.speed;

      if (s.ticker < 0.12) return;
      s.ticker = 0;

      const head = s.snake[0];

      // AI: decide direction toward food with some randomness
      if (s.food) {
        const dx = s.food.x - head.x;
        const dy = s.food.y - head.y;
        const choices = [];

        // Prefer direction toward food
        if (dx > 0 && s.dir.x !== -1) choices.push({ x: 1, y: 0 });
        if (dx < 0 && s.dir.x !== 1) choices.push({ x: -1, y: 0 });
        if (dy > 0 && s.dir.y !== -1) choices.push({ x: 0, y: 1 });
        if (dy < 0 && s.dir.y !== 1) choices.push({ x: 0, y: -1 });

        if (choices.length > 0 && Math.random() < params.intelligence) {
          const pick = choices[Math.floor(Math.random() * choices.length)];
          s.dir = pick;
        } else if (Math.random() < 0.15) {
          // Random turn
          const turns = [
            { x: 1, y: 0 }, { x: -1, y: 0 },
            { x: 0, y: 1 }, { x: 0, y: -1 },
          ].filter(d => !(d.x === -s.dir.x && d.y === -s.dir.y));
          s.dir = turns[Math.floor(Math.random() * turns.length)];
        }
      }

      // Move head
      const newHead = {
        x: (head.x + s.dir.x + s.cols) % s.cols,
        y: (head.y + s.dir.y + s.rows) % s.rows,
      };

      // Self collision
      if (s.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        resetSnake();
        return;
      }

      s.snake.unshift(newHead);

      // Eat food
      if (s.food && newHead.x === s.food.x && newHead.y === s.food.y) {
        s.growQueue += Math.round(params.growRate);
        placeFood();
      }

      // Grow or trim tail
      if (s.growQueue > 0) {
        s.growQueue--;
      } else {
        s.snake.pop();
      }
    },
    render(ctx, width, height, charW, charH, params, colors) {
      const cw = 14, ch = 20;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);
      ctx.font = `600 ${ch - 4}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';

      // Snake body
      for (let i = s.snake.length - 1; i >= 0; i--) {
        const seg = s.snake[i];
        const t = 1 - i / s.snake.length;
        if (i === 0) {
          ctx.fillStyle = colors.glow;
          ctx.fillText('@', seg.x * cw + cw / 2, seg.y * ch + ch - 4);
        } else {
          const alpha = 0.3 + t * 0.7;
          ctx.fillStyle = colors.primary + Math.round(alpha * 255).toString(16).padStart(2, '0');
          ctx.fillText('#', seg.x * cw + cw / 2, seg.y * ch + ch - 4);
        }
      }

      // Food
      if (s.food) {
        const pulse = Math.sin(s.time * 6) * 0.2 + 0.8;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = colors.glow;
        ctx.fillText('*', s.food.x * cw + cw / 2, s.food.y * ch + ch - 4);
        ctx.globalAlpha = 1;
      }
    },
    destroy() { s.snake = []; s.food = null; },
  };
}

export default {
  name: 'Snake',
  description: 'Classic snake chasing food',
  params: {
    speed:        { min: 0.3, max: 3, default: 1,   label: 'Speed',        step: 0.1 },
    growRate:     { min: 1,   max: 5, default: 2,   label: 'Grow Rate',    step: 1   },
    intelligence: { min: 0.3, max: 1, default: 0.7, label: 'Intelligence', step: 0.05 },
  },
  colors: { bg: '#0A0A0B', primary: '#00FF41', secondary: '#006600', glow: '#FF4444' },
  createInstance,
};
