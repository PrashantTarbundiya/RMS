import React, { useRef, useEffect } from 'react';

/**
 * InteractiveDotGrid
 * Renders a high-performance interactive dotted grid canvas.
 * When the user moves their cursor or touches the screen, dots in that area
 * dynamically brighten and scale up with a soft emerald ambient glow.
 */
export default function InteractiveDotGrid({ className = '', dotSpacing = 28, glowRadius = 180 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener('pointermove', handlePointerMove, { passive: true });
      parent.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    }

    let lastTime = performance.now();

    const render = (now) => {
      animFrameRef.current = requestAnimationFrame(render);
      if (width === 0 || height === 0) return;

      // Smooth cursor lerp (0.15 factor for fluid spring feel)
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle ambient cursor radial illumination
      if (mouse.x > -200 && mouse.x < width + 200 && mouse.y > -200 && mouse.y < height + 200) {
        const radGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, glowRadius * 1.3
        );
        radGrad.addColorStop(0, 'rgba(16, 185, 129, 0.12)');
        radGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.04)');
        radGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, glowRadius * 1.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw Grid of Dots
      const cols = Math.ceil(width / dotSpacing) + 1;
      const rows = Math.ceil(height / dotSpacing) + 1;

      // Group into base dots and illuminated dots for optimal drawing performance
      const baseDotPath = new Path2D();
      const illuminatedDots = [];

      for (let c = 0; c < cols; c++) {
        const x = c * dotSpacing;
        for (let r = 0; r < rows; r++) {
          const y = r * dotSpacing;
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const radSq = glowRadius * glowRadius;

          if (distSq < radSq) {
            const dist = Math.sqrt(distSq);
            const intensity = 1 - dist / glowRadius; // 1 at center, 0 at edge
            illuminatedDots.push({ x, y, intensity });
          } else {
            // Standard passive background dot
            baseDotPath.moveTo(x + 1, y);
            baseDotPath.arc(x, y, 1, 0, Math.PI * 2);
          }
        }
      }

      // Draw passive dots in single batch
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.fill(baseDotPath);

      // Draw illuminated dots near cursor
      for (let i = 0; i < illuminatedDots.length; i++) {
        const dot = illuminatedDots[i];
        const t = dot.intensity;
        const radius = 1 + t * 1.6; // Scale up to 2.6px at center

        // Color blends from neutral into bright emerald/white
        const alpha = 0.15 + t * 0.85;
        const green = Math.round(185 + t * 70); // brighter green toward center
        const blue = Math.round(129 + t * 126);

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(16 + t * 200)}, ${green}, ${blue}, ${alpha})`;
        ctx.fill();

        // Extra halo for center-most dots
        if (t > 0.6) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${(t - 0.6) * 0.4})`;
          ctx.fill();
        }
      }

      ctx.restore();
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      if (parent) {
        parent.removeEventListener('pointermove', handlePointerMove);
        parent.removeEventListener('pointerleave', handlePointerLeave);
      }
    };
  }, [dotSpacing, glowRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}

