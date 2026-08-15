"use client";

import { useEffect, useRef } from "react";

/**
 * Liquid-glass background for the Axon theme.
 * Fully self-owned: soft colour blobs drift and are nudged by the cursor,
 * rendered as layered radial gradients (no blur filter — far cheaper on mobile).
 * Scrolling fades the field while pointer interaction stays live.
 * Touch devices: pointer nudging off, fewer blobs. Honors prefers-reduced-motion.
 */

type Blob = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: readonly [number, number, number];
  alpha: number;
};

const NAVY = [27, 19, 60] as const;
const INDIGO = [67, 56, 160] as const;
const VIOLET = [109, 74, 190] as const;
const ORANGE = [249, 115, 22] as const;

// Navy-dominant with a single orange accent blob for brand warmth.
const PALETTE: readonly (readonly [number, number, number])[] = [
  NAVY,
  INDIGO,
  VIOLET,
  NAVY,
  ORANGE,
  INDIGO,
];

export default function AxonBackground(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let scrollDim = 0;
    let pointerX = -9999;
    let pointerY = -9999;
    const blobs: Blob[] = [];

    const seed = (): void => {
      blobs.length = 0;
      const count = isTouch ? 4 : PALETTE.length;
      for (let i = 0; i < count; i++) {
        const base = Math.min(width, height);
        blobs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          r: base * (0.28 + Math.random() * 0.22),
          hue: PALETTE[i % PALETTE.length],
          // orange stays subtle: it is an accent, not a co-star
          alpha: PALETTE[i % PALETTE.length] === ORANGE ? 0.16 : 0.26,
        });
      }
    };

    const resize = (): void => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const onScroll = (): void => {
      const y = window.scrollY || 0;
      scrollDim = Math.min(1, y / (window.innerHeight * 0.9));
    };

    const onMove = (e: MouseEvent): void => {
      pointerX = e.clientX;
      pointerY = e.clientY;
    };

    const onLeave = (): void => {
      pointerX = -9999;
      pointerY = -9999;
    };

    const frame = (): void => {
      ctx.clearRect(0, 0, width, height);
      const fade = 1 - scrollDim * 0.7;

      for (const b of blobs) {
        if (!reduceMotion) {
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < -b.r * 0.5 || b.x > width + b.r * 0.5) b.vx *= -1;
          if (b.y < -b.r * 0.5 || b.y > height + b.r * 0.5) b.vy *= -1;

          // Cursor gently pushes nearby fluid — the only interaction.
          if (!isTouch) {
            const dx = b.x - pointerX;
            const dy = b.y - pointerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.r && dist > 0.001) {
              const push = (1 - dist / b.r) * 0.35;
              b.x += (dx / dist) * push;
              b.y += (dy / dist) * push;
            }
          }
        }

        const [r, g, bl] = b.hue;
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${bl}, ${b.alpha * fade})`);
        grad.addColorStop(0.55, `rgba(${r}, ${g}, ${bl}, ${b.alpha * 0.35 * fade})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${bl}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(frame);
    };

    resize();
    onScroll();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!isTouch && !reduceMotion) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseout", onLeave);
    }
    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{
        background:
          "linear-gradient(180deg, #FBFAFD 0%, #F3F1F9 50%, #EFEDF7 100%)",
      }}
    />
  );
}
