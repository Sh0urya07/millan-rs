/* ==========================================================================
   MILAN — ambient particle system
   Signature "bubble" effect reimagined for a bakery: warm rising motes of
   sugar-dust / steam that drift up past the copy, catch the marigold light,
   and gently swirl away from the cursor. GPU-friendly canvas 2D, capped
   particle count, DPR aware, respects prefers-reduced-motion.
   ========================================================================== */
(function(){
  const canvas = document.getElementById('bubble-canvas');
  if(!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d', { alpha: true });
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0;
  let particles = [];
  let pointer = { x: -9999, y: -9999, active: false };
  let raf = null;
  let lastTime = 0;

  const palette = [
    'rgba(240,183,92,ALPHA)',   // marigold
    'rgba(211,115,59,ALPHA)',   // terracotta
    'rgba(246,206,140,ALPHA)',  // light marigold
    'rgba(251,243,228,ALPHA)'   // cream
  ];

  function count(){
    const area = w * h;
    // roughly one particle per 26,000px^2, capped for perf
    const base = Math.round(area / 26000);
    return Math.max(18, Math.min(base, window.innerWidth < 640 ? 34 : 62));
  }

  function makeParticle(spawnAtBottom){
    const r = 3 + Math.random() * 15; // size variety
    return {
      x: Math.random() * w,
      y: spawnAtBottom ? h + r + Math.random() * 80 : Math.random() * h,
      r,
      baseR: r,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(0.12 + Math.random() * 0.32) * (r < 8 ? 1.3 : 0.7),
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.004 + Math.random() * 0.01,
      wobbleAmp: 8 + Math.random() * 18,
      alpha: 0.05 + Math.random() * 0.22,
      color: palette[Math.floor(Math.random() * palette.length)],
      blur: r > 10,
      layer: Math.random() < 0.35 ? 'front' : 'back' // depth illusion
    };
  }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    w = window.innerWidth; h = window.innerHeight;
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const target = count();
    if(particles.length < target){
      while(particles.length < target) particles.push(makeParticle(false));
    } else {
      particles.length = target;
    }
  }

  function step(t){
    if(!lastTime) lastTime = t;
    const dt = Math.min(t - lastTime, 40);
    lastTime = t;

    ctx.clearRect(0,0,w,h);

    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      p.wobble += p.wobbleSpeed * dt;
      const wobbleX = Math.sin(p.wobble) * p.wobbleAmp * 0.02;

      p.x += p.vx * dt * 0.06 + wobbleX * 0.02;
      p.y += p.vy * dt * 0.06;

      // mouse repulsion — gentle push away, natural not snappy
      if(pointer.active){
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        const radius = 130;
        if(dist < radius && dist > 0.001){
          const force = (1 - dist / radius) * 1.6;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }

      // recycle when off-screen
      if(p.y < -30){
        Object.assign(p, makeParticle(true));
      }
      if(p.x < -40) p.x = w + 40;
      if(p.x > w + 40) p.x = -40;

      const alpha = p.alpha;
      const color = p.color.replace('ALPHA', alpha.toFixed(3));

      ctx.beginPath();
      if(p.blur){
        ctx.filter = 'blur(3px)';
      } else {
        ctx.filter = 'blur(0.5px)';
      }
      ctx.fillStyle = color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.filter = 'none';

    raf = requestAnimationFrame(step);
  }

  function onPointerMove(e){
    const touch = e.touches && e.touches[0];
    pointer.x = touch ? touch.clientX : e.clientX;
    pointer.y = touch ? touch.clientY : e.clientY;
    pointer.active = true;
  }
  function onPointerLeave(){ pointer.active = false; }

  function start(){
    resize();
    if(reduceMotion){
      // static, minimal render: draw once, no animation loop
      ctx.clearRect(0,0,w,h);
      particles.slice(0, 14).forEach(p=>{
        ctx.beginPath();
        ctx.fillStyle = p.color.replace('ALPHA', '0.08');
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      });
      return;
    }
    raf = requestAnimationFrame(step);
    window.addEventListener('mousemove', onPointerMove, { passive:true });
    window.addEventListener('touchmove', onPointerMove, { passive:true });
    window.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('touchend', onPointerLeave);
  }

  let resizeTimer;
  window.addEventListener('resize', ()=>{
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden && raf){ cancelAnimationFrame(raf); raf = null; }
    else if(!document.hidden && !raf && !reduceMotion){ lastTime = 0; raf = requestAnimationFrame(step); }
  });

  start();
})();
