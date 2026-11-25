import { useLocale, useTranslations } from "next-intl";

type PointId = "sales" | "stock" | "customers";

const POINTS: PointId[] = ["sales", "stock", "customers"];

export default function OnyxAiSpotlight(): React.JSX.Element {
  const t = useTranslations("OnyxAiSpotlight");
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section
      id="ai-spotlight"
      dir={isAr ? "rtl" : "ltr"}
      className="relative w-full scroll-mt-4 border-t border-white/10 bg-black px-6 py-24 md:px-10 md:py-32"
      style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
    >
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-xs text-white/60">{t("eyebrow")}</p>
          <h2 className="mt-3 max-w-md text-4xl font-medium tracking-tight text-white md:text-5xl">
            {t("heading")}
          </h2>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/70">
            {t("description")}
          </p>
        </div>

        {/* Static illustration only — no live data, so nothing here can go stale. */}
        <div
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6"
          aria-label={t("exampleLabel")}
        >
          <p className="mb-4 text-[11px] text-white/40">{t("exampleLabel")}</p>

          <div className="flex flex-col gap-3">
            <div className="max-w-[85%] self-end rounded-2xl rounded-ee-sm bg-white px-4 py-3 text-sm text-black">
              {t("question")}
            </div>

            <div className="max-w-[92%] self-start rounded-2xl rounded-es-sm border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-sm text-white/80">{t("answerLead")}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {POINTS.map((id) => (
                  <li key={id} className="flex items-start gap-2.5 text-sm text-white">
                    <span
                      className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/60"
                      aria-hidden="true"
                    />
                    {t(`points.${id}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="mt-5 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/30"
            aria-hidden="true"
          >
            {t("inputPlaceholder")}
          </div>
        </div>
      </div>
    </section>
  );
}
