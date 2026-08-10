"use client";

import { useEffect, useState } from "react";
import { PARTICLE_SECTION_IDS, type ParticleSectionId } from "@/lib/particle-themes";

export function useActiveSection(): ParticleSectionId {
  const [active, setActive] = useState<ParticleSectionId>(PARTICLE_SECTION_IDS[0]);

  useEffect(() => {
    const sections = PARTICLE_SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId !== null && (PARTICLE_SECTION_IDS as readonly string[]).includes(bestId)) {
          setActive(bestId as ParticleSectionId);
        }
      },
      { threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9, 1] },
    );

    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return active;
}
