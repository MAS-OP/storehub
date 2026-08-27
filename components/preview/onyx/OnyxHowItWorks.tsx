"use client";

import { useLocale, useTranslations } from "next-intl";

interface Step {
  id: string;
  number: string;
}

const STEPS: Step[] = [
  { id: "create", number: "01" },
  { id: "products", number: "02" },
  { id: "storefront", number: "03" },
  { id: "launch", number: "04" },
];

export default function OnyxHowItWorks(): React.JSX.Element {
  const t = useTranslations("OnyxHowItWorks");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="relative w-full bg-black px-6 py-24 md:px-10 md:py-32"
      style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-xs text-white/60">{t("eyebrow")}</p>
        <h2 className="mt-3 max-w-xl text-4xl font-medium tracking-tight text-white md:text-6xl">
          {t("heading")}
        </h2>

        <ol className="mt-16 flex flex-col gap-12 md:mt-20 md:gap-16">
          {STEPS.map((step) => (
            <li
              key={step.id}
              className="flex flex-col gap-4 md:flex-row md:items-baseline md:gap-8"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`hidden h-px w-12 bg-white/40 md:block ${
                    isAr ? "rotate-[-20deg]" : "rotate-[20deg]"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-4xl font-medium tracking-tight text-white md:text-5xl">
                  {step.number}
                </span>
              </div>
              <div className="md:max-w-md">
                <h3 className="text-lg font-medium text-white">
                  {t(`steps.${step.id}.title`)}
                </h3>
                <p className="mt-1 text-[15px] leading-snug text-white/70">
                  {t(`steps.${step.id}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
