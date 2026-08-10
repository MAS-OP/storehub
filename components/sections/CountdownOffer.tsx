'use client';

import { useEffect, useState, type ReactElement } from "react";
import type { CountdownOfferConfig } from "@/lib/sections/types";

interface CountdownOfferProps {
  config: CountdownOfferConfig;
  locale: "ar" | "en";
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function useCountdownParts(endsAt: string): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const target = new Date(endsAt).getTime();

    const tick = (): void => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setParts(null);
        return;
      }
      setParts({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1000),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return parts;
}

interface DigitBoxProps {
  value: number;
  label: string;
}

function DigitBox({ value, label }: DigitBoxProps): ReactElement {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        dir="ltr"
        className="flex h-12 min-w-12 items-center justify-center rounded-lg bg-black/20 px-2 font-mono text-xl font-bold tabular-nums"
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[11px] opacity-90">{label}</span>
    </div>
  );
}

export default function CountdownOffer({ config, locale }: CountdownOfferProps): ReactElement | null {
  const isRtl = locale === "ar";
  const parts = useCountdownParts(config.ends_at);

  // null parts means either not-yet-mounted (SSR) or expired — either way, nothing to show yet
  if (!parts) return null;

  const labels = isRtl
    ? { days: "يوم", hours: "ساعة", minutes: "دقيقة", seconds: "ثانية" }
    : { days: "days", hours: "hrs", minutes: "min", seconds: "sec" };

  const backgroundClass =
    config.background_style === "gradient"
      ? "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground"
      : "bg-accent text-accent-foreground";

  return (
    <section
      dir={isRtl ? "rtl" : "ltr"}
      className={`flex w-full flex-col items-center justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:p-8 ${backgroundClass}`}
    >
      <div className={isRtl ? "text-center sm:text-right" : "text-center sm:text-left"}>
        <h2 className="text-xl font-bold sm:text-2xl">{isRtl ? config.title_ar : config.title_en}</h2>
        <p className="mt-1 text-sm opacity-90">{isRtl ? config.subtitle_ar : config.subtitle_en}</p>
      </div>

      <div className="flex items-center gap-2">
        {parts.days > 0 && <DigitBox value={parts.days} label={labels.days} />}
        <DigitBox value={parts.hours} label={labels.hours} />
        <DigitBox value={parts.minutes} label={labels.minutes} />
        <DigitBox value={parts.seconds} label={labels.seconds} />
      </div>

      <a
        href={config.href}
        className="rounded-full bg-white/95 px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-white"
      >
        {isRtl ? "تسوّق الآن" : "Shop Now"}
      </a>
    </section>
  );
}
