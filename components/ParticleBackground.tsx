"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { DEFAULT_PARTICLE_THEME, type ParticleTheme } from "@/lib/particle-themes";

interface ParticleBackgroundProps {
  theme?: ParticleTheme;
  className?: string;
  maxDensity?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isAccent: boolean;
  activation: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const LINK_DISTANCE = 130;
const MOUSE_RADIUS = 160;
const MOUSE_PUSH_STRENGTH = 0.6;
const THEME_LERP_SPEED = 0.05;
const ACTIVATION_BAND = 0.08;

function parseHsl(value: string): Hsl {
  const [h, s, l] = value.trim().split(/\s+/).map((part) => parseFloat(part));
  return { h: h || 0, s: s || 0, l: l || 0 };
}

function shiftHsl(base: Hsl, theme: ParticleTheme): Hsl {
  return {
    h: base.h + theme.hueShift,
    s: Math.min(100, Math.max(0, base.s * theme.saturationMult)),
    l: Math.min(95, Math.max(5, base.l + theme.lightnessShift)),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function ParticleBackground({
  theme = DEFAULT_PARTICLE_THEME,
  className = "",
  maxDensity = 0.00009,
}: ParticleBackgroundProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeTargetRef = useRef<ParticleTheme>(theme);

  useEffect(() => {
    themeTargetRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const rootStyle = getComputedStyle(document.documentElement);
    const baseAccent = parseHsl(rootStyle.getPropertyValue("--accent").trim() || "15 85% 60%");
    const basePrimary = parseHsl(rootStyle.getPropertyValue("--primary").trim() || "220 20% 15%");

    const current: ParticleTheme = { ...themeTargetRef.current };

    let particles: Particle[] = [];
    let animationFrameId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let frame = 0;
    const mouse = { x: -9999, y: -9999 };

    const resize = (): void => {
      const { clientWidth, clientHeight } = canvas;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(clientWidth * clientHeight * maxDensity);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * clientWidth,
        y: Math.random() * clientHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 1,
        isAccent: Math.random() < 0.35,
        activation: Math.random(),
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.02,
      }));
    };

    const onPointerMove = (e: PointerEvent): void => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const onPointerLeave = (): void => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const step = (): void => {
      frame += 1;
      const target = themeTargetRef.current;
      current.densityRatio = lerp(current.densityRatio, target.densityRatio, THEME_LERP_SPEED);
      current.hueShift = lerp(current.hueShift, target.hueShift, THEME_LERP_SPEED);
      current.saturationMult = lerp(current.saturationMult, target.saturationMult, THEME_LERP_SPEED);
      current.lightnessShift = lerp(current.lightnessShift, target.lightnessShift, THEME_LERP_SPEED);

      const accent = shiftHsl(baseAccent, current);
      const primary = shiftHsl(basePrimary, current);
      const accentStr = `${accent.h} ${accent.s}% ${accent.l}%`;
      const primaryStr = `${primary.h} ${primary.s}% ${primary.l}%`;

      const { clientWidth: w, clientHeight: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        const delta = current.densityRatio - p.activation;
        const visibility =
          delta > ACTIVATION_BAND ? 1 : delta < -ACTIVATION_BAND ? 0 : (delta + ACTIVATION_BAND) / (ACTIVATION_BAND * 2);
        if (visibility <= 0) continue;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distToMouse = Math.hypot(dx, dy);
        if (distToMouse < MOUSE_RADIUS) {
          const force = (1 - distToMouse / MOUSE_RADIUS) * MOUSE_PUSH_STRENGTH;
          p.vx += (dx / (distToMouse || 1)) * force;
          p.vy += (dy / (distToMouse || 1)) * force;
        }

        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const twinkle = 0.75 + 0.25 * Math.sin(frame * p.twinkleSpeed + p.twinklePhase);
        ctx.shadowBlur = p.isAccent ? 4 : 0;
        ctx.shadowColor = p.isAccent ? `hsl(${accentStr} / 0.6)` : "transparent";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.isAccent ? accentStr : primaryStr} / ${0.62 * visibility * twinkle})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        if (current.densityRatio - a.activation < -ACTIVATION_BAND) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          if (current.densityRatio - b.activation < -ACTIVATION_BAND) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsl(${primaryStr} / ${0.12 * (1 - dist / LINK_DISTANCE)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    if (!prefersReducedMotion) {
      animationFrameId = requestAnimationFrame(step);
    } else {
      step();
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [maxDensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 h-full w-full ${className}`}
    />
  );
}
