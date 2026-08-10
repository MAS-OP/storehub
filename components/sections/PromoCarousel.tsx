'use client';

import { useEffect, useState, type ReactElement } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { PromoCarouselConfig, PromoCarouselCard } from "@/lib/sections/types";

interface PromoCarouselProps {
  config: PromoCarouselConfig;
  locale: "ar" | "en";
}

function useCountdown(endsAt: string | null): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setLabel(null);
      return;
    }
    const target = new Date(endsAt).getTime();
    const pad = (n: number): string => String(n).padStart(2, "0");

    const tick = (): void => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setLabel(null);
        return;
      }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      setLabel(
        days > 0
          ? `${days}:${pad(hours)}:${pad(minutes)}`
          : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return label;
}

interface PromoCardProps {
  card: PromoCarouselCard;
  locale: "ar" | "en";
}

function PromoCard({ card, locale }: PromoCardProps): ReactElement {
  const isRtl = locale === "ar";
  const countdown = useCountdown(card.ends_at);
  const badgeText = isRtl ? card.badge_ar : card.badge_en;
  const discountText =
    !badgeText && card.discount_percent !== null
      ? isRtl
        ? `خصم ${card.discount_percent}%`
        : `${card.discount_percent}% OFF`
      : null;

  return (
    <a
      href={card.href}
      className="group relative flex min-w-0 flex-[0_0_78%] flex-col overflow-hidden rounded-xl border border-border bg-card sm:flex-[0_0_260px]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={card.image_url}
          alt={isRtl ? card.title_ar : card.title_en}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {(badgeText || discountText) && (
          <span className="absolute top-2 start-2 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            {badgeText ?? discountText}
          </span>
        )}
        {countdown && (
          // dir="ltr" pinned so digit/colon order stays stable inside RTL layout
          <span
            dir="ltr"
            className="absolute bottom-2 end-2 rounded-md bg-black/70 px-2 py-0.5 font-mono text-xs text-white"
          >
            {countdown}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">
          {isRtl ? card.title_ar : card.title_en}
        </h3>
      </div>
    </a>
  );
}

export default function PromoCarousel({ config, locale }: PromoCarouselProps): ReactElement | null {
  const isRtl = locale === "ar";
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    direction: isRtl ? "rtl" : "ltr",
  });

  if (config.cards.length === 0) return null;

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="w-full">
      <h2 className="mb-3 text-xl font-bold text-foreground sm:text-2xl">
        {isRtl ? config.heading_ar : config.heading_en}
      </h2>
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-3">
          {config.cards.map((card) => (
            <PromoCard key={card.id} card={card} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
