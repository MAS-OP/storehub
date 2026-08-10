export const PARTICLE_SECTION_IDS = [
  "hero",
  "how-it-works",
  "features",
  "ai-spotlight",
  "pricing",
  "testimonials",
  "final-cta",
] as const;

export type ParticleSectionId = (typeof PARTICLE_SECTION_IDS)[number];

export interface ParticleTheme {
  densityRatio: number; // 0..1, fraction of particle pool active
  hueShift: number; // degrees added to base --accent/--primary hue
  saturationMult: number; // multiplier on base saturation
  lightnessShift: number; // percentage points added to base lightness
}

export const PARTICLE_THEMES: Record<ParticleSectionId, ParticleTheme> = {
  hero: { densityRatio: 1, hueShift: 0, saturationMult: 1, lightnessShift: 0 },
  "how-it-works": { densityRatio: 0.55, hueShift: -18, saturationMult: 0.8, lightnessShift: 8 },
  features: { densityRatio: 0.8, hueShift: 14, saturationMult: 1.15, lightnessShift: -6 },
  "ai-spotlight": { densityRatio: 0.45, hueShift: -28, saturationMult: 0.7, lightnessShift: 10 },
  pricing: { densityRatio: 0.9, hueShift: 20, saturationMult: 1.25, lightnessShift: -8 },
  testimonials: { densityRatio: 0.4, hueShift: -10, saturationMult: 0.85, lightnessShift: 6 },
  "final-cta": { densityRatio: 0.35, hueShift: 6, saturationMult: 1.1, lightnessShift: 12 },
};

export const DEFAULT_PARTICLE_THEME: ParticleTheme = PARTICLE_THEMES.hero;
