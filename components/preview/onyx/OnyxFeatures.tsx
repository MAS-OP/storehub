"use client";

import { useLocale, useTranslations } from "next-intl";

type FeatureId = "payments" | "noFees" | "builder" | "ai" | "shipping" | "whatsapp";

const ITEMS: FeatureId[] = ["payments", "noFees", "builder", "ai", "shipping", "whatsapp"];

function Icon({ id }: { id: FeatureId }): React.JSX.Element {
  const common = {
    viewBox: "0 0 24 24",
    className: "h-6 w-6",
    fill: "none",
    stroke: "#ffffff",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (id) {
    case "payments":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case "noFees":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M5.6 5.6l12.8 12.8" />
        </svg>
      );
    case "builder":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case "ai":
      return (
        <svg {...common}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
        </svg>
      );
    case "shipping":
      return (
        <svg {...common}>
          <rect x="1.5" y="6" width="12.5" height="10" rx="1" />
          <path d="M14 9h4l3 3v4h-7" />
          <circle cx="6" cy="18" r="1.8" />
          <circle cx="17" cy="18" r="1.8" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      );
  }
}

export default function OnyxFeatures(): React.JSX.Element {
  const t = useTranslations("OnyxFeatures");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section
      id="features"
      dir={isAr ? "rtl" : "ltr"}
      className="relative w-full scroll-mt-4 bg-black px-6 py-24 md:px-10 md:py-32"
      style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-5xl">
        <p className="text-xs text-white/60">{t("eyebrow")}</p>
        <h2 className="mt-3 max-w-xl text-4xl font-medium tracking-tight text-white md:text-6xl">
          {t("heading")}
        </h2>

        <ul className="mt-16 grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 md:mt-20">
          {ITEMS.map((id) => (
            <li key={id} className="flex flex-col gap-4">
              <Icon id={id} />
              <span
                className={`h-px w-12 bg-white/40 ${
                  isAr ? "rotate-[-20deg]" : "rotate-[20deg]"
                }`}
                aria-hidden="true"
              />
              <div>
                <h3 className="text-lg font-medium text-white">
                  {t(`items.${id}.title`)}
                </h3>
                <p className="mt-1 text-[15px] leading-snug text-white/70">
                  {t(`items.${id}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
