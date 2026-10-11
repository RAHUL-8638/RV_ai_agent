import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  opacity?: number;
  speed?: number;
  density?: number;
  className?: string;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({
  opacity = 0.35,
  speed = 33, // ~30 fps interval
  density = 0.95,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Characters: Katakana, Cyrillic, Greek, numbers, binary & code symbols
    const chars = '01010110010101010101010123456789ABCDEF$#@%&*+-/<>{}[]=~|アイウエオカキクケコサシスセソタチツテト';
    const fontSize = 14;
    let columns = Math.floor(canvas.width / fontSize);
    let drops: number[] = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));

    const draw = (currentTime: number) => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const delta = currentTime - lastTime;
      if (delta < speed) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      lastTime = currentTime;

      // Recalculate if columns changed
      const currentCols = Math.floor(canvas.width / fontSize);
      if (currentCols !== columns) {
        columns = currentCols;
        drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));
      }

      // Translucent black fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random char
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Head of stream has bright neon green / white glow
        if (Math.random() > 0.85) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#00ff66';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 4;
        }

        ctx.fillText(char, x, y);

        // Reset shadow
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > density) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, density]);

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity }}
      className={`pointer-events-none absolute inset-0 h-full w-full select-none ${className}`}
      aria-hidden="true"
    />
  );
};
