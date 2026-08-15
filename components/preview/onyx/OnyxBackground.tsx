"use client";

import { useEffect, useRef } from "react";

/**
 * Onyx-theme background: fully self-owned canvas (no external asset).
 * Slow monochrome light streaks drift over pure black; the whole field
 * parallaxes gently with the cursor. Touch devices get no parallax and
 * fewer streaks. Honors prefers-reduced-motion. Single rAF, full cleanup.
 */

type Streak = {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  depth: number; // parallax factor, 0.2 (far) .. 1 (near)
  width: number;
};

const ANGLE = -0.42; // radians — consistent diagonal lean for every streak

export default function OnyxBackground(): React.JSX.Element {
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
    let targetPx = 0;
    let targetPy = 0;
    let px = 0;
    let py = 0;
    const streaks: Streak[] = [];

    const seed = (): void => {
      streaks.length = 0;
      const count = isTouch ? 14 : 30;
      for (let i = 0; i < count; i++) {
        const depth = 0.2 + Math.random() * 0.8;
        streaks.push({
          x: Math.random() * width * 1.4 - width * 0.2,
          y: Math.random() * height * 1.4 - height * 0.2,
          len: (60 + Math.random() * 260) * depth,
          speed: (0.12 + Math.random() * 0.4) * depth,
          alpha: (0.06 + Math.random() * 0.22) * depth,
          depth,
          width: depth < 0.5 ? 1 : 1.6,
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

    const onMove = (e: MouseEvent): void => {
      // -1 .. 1 around the viewport centre
      targetPx = (e.clientX / window.innerWidth - 0.5) * 2;
      targetPy = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const frame = (): void => {
      ctx.clearRect(0, 0, width, height);

      // ease toward the cursor so the parallax feels weighted, not twitchy
      px += (targetPx - px) * 0.05;
      py += (targetPy - py) * 0.05;

      const dx = Math.cos(ANGLE);
      const dy = Math.sin(ANGLE);

      for (const s of streaks) {
        if (!reduceMotion) {
          s.x += dx * s.speed;
          s.y += dy * s.speed;
          if (s.x > width * 1.2) s.x = -width * 0.2;
          if (s.y < -height * 0.2) s.y = height * 1.2;
        }

        // deeper streaks shift less — that difference is what reads as depth
        const shift = 26 * s.depth;
        const cx = s.x - px * shift;
        const cy = s.y - py * shift;

        const grad = ctx.createLinearGradient(
          cx,
          cy,
          cx + dx * s.len,
          cy + dy * s.len
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${s.alpha})`);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.width;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dx * s.len, cy + dy * s.len);
        ctx.stroke();
      }

      rafId = window.requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!isTouch && !reduceMotion) window.addEventListener("mousemove", onMove);
    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ background: "#000000" }}
    />
  );
}
