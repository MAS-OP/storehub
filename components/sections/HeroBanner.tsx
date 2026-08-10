'use client';

import { useCallback, useEffect, useState, type ReactElement } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroBannerConfig } from "@/lib/sections/types";

interface HeroBannerProps {
  config: HeroBannerConfig;
  locale: "ar" | "en";
}

export default function HeroBanner({ config, locale }: HeroBannerProps): ReactElement | null {
  const isRtl = locale === "ar";
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: config.slides.length > 1,
    direction: isRtl ? "rtl" : "ltr",
  });
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const scrollPrev = useCallback((): void => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((): void => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number): void => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = (): void => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || config.slides.length <= 1 || config.autoplay_ms <= 0) return;
    // Respect user's motion preference — no forced autoplay for reduced-motion users
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const interval = setInterval(() => emblaApi.scrollNext(), config.autoplay_ms);
    return () => clearInterval(interval);
  }, [emblaApi, config.slides.length, config.autoplay_ms]);

  if (config.slides.length === 0) return null;

  return (
    <section dir={isRtl ? "rtl" : "ltr"} className="relative w-full overflow-hidden rounded-2xl bg-muted">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {config.slides.map((slide) => (
            <div key={slide.id} className="relative min-w-0 flex-[0_0_100%]">
              <div className="relative aspect-[16/7] w-full sm:aspect-[21/8]">
                <img
                  src={slide.image_url}
                  alt={isRtl ? slide.title_ar : slide.title_en}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div
                  className={`absolute inset-0 flex flex-col justify-end gap-2 p-6 sm:p-10 ${
                    isRtl ? "items-end text-right" : "items-start text-left"
                  }`}
                >
                  <h2 className="text-2xl font-bold text-white sm:text-4xl">
                    {isRtl ? slide.title_ar : slide.title_en}
                  </h2>
                  <p className="max-w-md text-sm text-white/90 sm:text-base">
                    {isRtl ? slide.subtitle_ar : slide.subtitle_en}
                  </p>
                  <a
                    href={slide.cta_href}
                    className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {isRtl ? slide.cta_label_ar : slide.cta_label_en}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {config.slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label={isRtl ? "الشريحة السابقة" : "Previous slide"}
            className="absolute top-1/2 start-3 -translate-y-1/2 rounded-full bg-white/80 p-2 text-foreground shadow-md transition-colors hover:bg-white"
          >
            {isRtl ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label={isRtl ? "الشريحة التالية" : "Next slide"}
            className="absolute top-1/2 end-3 -translate-y-1/2 rounded-full bg-white/80 p-2 text-foreground shadow-md transition-colors hover:bg-white"
          >
            {isRtl ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {config.slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => scrollTo(index)}
                aria-label={`${isRtl ? "الانتقال للشريحة" : "Go to slide"} ${index + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  index === selectedIndex ? "w-6 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
