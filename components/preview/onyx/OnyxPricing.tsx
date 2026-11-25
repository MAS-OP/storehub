"use client";

import { useLocale, useTranslations } from "next-intl";

function Check(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-4 w-4 shrink-0"
      fill="none"
      stroke="#ffffff"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export default function OnyxPricing(): React.JSX.Element {
  const t = useTranslations("OnyxPricing");
  const locale = useLocale();
  const isAr = locale === "ar";
  const features = t.raw("features") as string[];

  return (
    <section
      id="pricing"
      dir={isAr ? "rtl" : "ltr"}
      className="relative w-full scroll-mt-4 bg-black px-6 py-24 md:px-10 md:py-32"
      style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-xs text-white/60">{t("eyebrow")}</p>
        <h2 className="mt-3 max-w-xl text-4xl font-medium tracking-tight text-white md:text-6xl">
          {t("heading")}
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-snug text-white/70">
          {t("subheading")}
        </p>

        <div className="mt-16 md:mt-20">
          <span
            className={`block h-px w-24 bg-white/40 ${
              isAr ? "rotate-[-20deg]" : "rotate-[20deg]"
            }`}
            aria-hidden="true"
          />

          <p className="mt-8 text-xs text-white/60">{t("label")}</p>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-7xl font-medium tracking-tight text-white md:text-8xl">
              {t("price")}
            </span>
            <span className="text-lg text-white/70">{t("currency")}</span>
          </div>
          <p className="mt-2 text-[15px] text-white/50 line-through">{t("oldPrice")}</p>
          <p className="mt-4 text-sm text-white/70">{t("guarantee")}</p>

          <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
            {features.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] text-white/90">
                <Check />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <a
            href={isAr ? "/ar/create" : "/en/create"}
            className="mt-12 inline-flex items-center rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            {t("cta")}
          </a>
        </div>
      </div>
    </section>
  );
}
