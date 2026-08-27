"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import OnyxBackground from "@/components/preview/onyx/OnyxBackground";

const NAV_KEYS = ["features", "pricing", "demo", "login"] as const;

// Placeholder figures, matching the live landing page. Replace with real
// numbers before any public launch.
const STATS = [
  { value: "+12.5k", key: "stores" },
  { value: "+280k", key: "orders" },
  { value: "+8.4k", key: "merchants" },
] as const;

function StoreHubMark(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5 5 4h14l1.5 4.5M3.5 8.5h17M3.5 8.5v10.5a1 1 0 0 0 1 1h15a1 1 0 0 0 1-1V8.5M9 20v-6h6v6"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function OnyxHero(): React.JSX.Element {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="relative h-screen w-full overflow-hidden bg-black"
      style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
    >
      <OnyxBackground />

      {/* Navbar */}
      <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-6 pt-6 md:px-10">
        <span className="flex items-center gap-2 rounded-full bg-neutral-900/90 py-3 ps-4 pe-6 backdrop-blur">
          <StoreHubMark />
          <span className="text-sm font-normal tracking-tight text-white">
            StoreHub
          </span>
        </span>

        <span className="hidden items-center gap-1 rounded-full bg-neutral-900/90 px-3 py-2 backdrop-blur md:flex">
          {NAV_KEYS.map((key) => (
            <Link
              key={key}
              href={key === "login" ? `/${locale}/login` : `#${key}`}
              className="rounded-full px-5 py-2 text-sm text-neutral-300 transition-colors hover:text-white"
            >
              {t(`nav.${key}`)}
            </Link>
          ))}
        </span>

        <span className="flex items-center gap-2">
          <Link
            href={isAr ? "/en/preview/onyx" : "/ar/preview/onyx"}
            className="rounded-full bg-neutral-900/90 px-4 py-3 text-xs text-neutral-300 backdrop-blur transition-colors hover:text-white"
          >
            {isAr ? "EN" : "AR"}
          </Link>
          <Link
            href={`/${locale}/create`}
            className="rounded-full bg-white px-6 py-3 text-sm font-normal text-black transition-colors hover:bg-neutral-200"
          >
            {t("nav.start")}
          </Link>
        </span>
      </nav>

      {/* Foreground */}
      <div className="relative h-full w-full">
        <div className="group absolute inset-y-0 start-6 z-10 flex max-w-xl flex-col justify-center gap-5 md:start-10">
          <h1 className="text-5xl font-medium leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
            {isAr ? (
              <>
                متجرك الإلكتروني
                <br />
                تمتلكه للأبد
              </>
            ) : (
              <>
                Own your
                <br />
                store
              </>
            )}
          </h1>

          <div className="flex items-center gap-6 opacity-100 transition-opacity duration-500 motion-safe:opacity-0 motion-safe:group-hover:opacity-100">
            <span className="flex items-center gap-2 text-xs text-white/70">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="M14.7 6.3a4 4 0 1 0-3.4 6.1L4 19.7V22h2.3l7.3-7.3a4 4 0 0 0 1.1-8.4Z"
                  stroke="#ffffff"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isAr ? "امتلاك حقيقي" : "Real ownership"}
            </span>
            <span className="flex items-center gap-2 text-xs text-white/70">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="M18.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-9 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm2 0h3"
                  stroke="#ffffff"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {isAr ? "استقلالية كاملة" : "Full independence"}
            </span>
          </div>

          <p className="max-w-[280px] text-[15px] leading-snug text-white/90">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Stat — top end */}
        <div className="absolute top-[14%] end-6 z-10 md:end-24">
          <div className="flex items-center justify-end gap-3">
            <span
              className={`hidden h-px w-24 bg-white/40 md:block ${isAr ? "rotate-[-20deg]" : "rotate-[20deg]"}`}
            />
            <span className="text-4xl font-medium tracking-tight text-white md:text-5xl">
              {STATS[0].value}
            </span>
          </div>
          <div className="mt-1 text-end text-xs text-white/70 md:text-sm">
            {t(`hero.stats.${STATS[0].key}`)}
          </div>
        </div>

        {/* Stat — bottom start */}
        <div className="absolute bottom-20 start-6 z-10 md:bottom-24 md:start-20">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-medium tracking-tight text-white md:text-5xl">
              {STATS[1].value}
            </span>
            <span
              className={`hidden h-px w-24 bg-white/40 md:block ${isAr ? "rotate-[20deg]" : "rotate-[-20deg]"}`}
            />
          </div>
          <div className="mt-1 text-xs text-white/70 md:text-sm">
            {t(`hero.stats.${STATS[1].key}`)}
          </div>
        </div>

        {/* Stat — bottom end */}
        <div className="absolute bottom-16 end-6 z-10 md:bottom-20 md:end-20">
          <div className="flex items-center justify-end gap-3">
            <span
              className={`hidden h-px w-24 bg-white/40 md:block ${isAr ? "rotate-[20deg]" : "rotate-[-20deg]"}`}
            />
            <span className="text-4xl font-medium tracking-tight text-white md:text-5xl">
              {STATS[2].value}
            </span>
          </div>
          <div className="mt-1 text-end text-xs text-white/70 md:text-sm">
            {t(`hero.stats.${STATS[2].key}`)}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-black" />
      </div>
    </section>
  );
}
