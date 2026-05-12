export function launchConfetti(canvasId, durationMs = 1500) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  const colors = ["#8b5cf6", "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#22d3ee"];
  const pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * 100,
    r: 3 + Math.random() * 4,
    c: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 3,
    vx: -1 + Math.random() * 2,
    rotate: Math.random() * Math.PI
  }));
  const start = performance.now();

  function tick(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rotate += 0.03;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotate);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
      ctx.restore();
    });
    if (elapsed < durationMs) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(tick);
}
