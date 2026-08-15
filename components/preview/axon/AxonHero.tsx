"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Store, Sparkles, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};

/**
 * Axon-theme hero. Content comes from the SAME next-intl messages as the live
 * landing page — only the visual layer differs (navy palette, Instrument Serif
 * display type, liquid-glass surfaces).
 */
export default function AxonHero(): React.JSX.Element {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center px-4 pb-16 pt-28"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Nav */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-4 md:pt-6">
        <nav className="flex items-center gap-6 rounded-2xl border border-white/50 bg-white/60 px-5 py-3 shadow-[0_8px_32px_rgba(27,19,60,0.08)] backdrop-blur-xl md:px-7">
          <span className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1B133C]">
              <Store className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight text-[#1B133C]">
              StoreHub
            </span>
          </span>
          <span className="hidden items-center gap-6 sm:flex">
            {(["features", "pricing"] as const).map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className="text-sm font-medium text-[#1B133C]/70 transition-colors hover:text-[#1B133C]"
              >
                {t(`nav.${key}`)}
              </a>
            ))}
            <Link
              href={`/${locale}/login`}
              className="text-sm font-medium text-[#1B133C]/70 transition-colors hover:text-[#1B133C]"
            >
              {t("nav.login")}
            </Link>
            <Link
              href={`/${locale}/create`}
              className="rounded-xl bg-[#1B133C] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("nav.start")}
            </Link>
          </span>
        </nav>
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#1B133C]/10 bg-white/60 px-4 py-2 text-sm font-medium text-[#1B133C] backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 text-orange-500" />
          {t("hero.badge")}
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="mb-6 text-5xl leading-[1.05] tracking-tight text-[#1B133C] sm:text-6xl md:text-7xl"
          style={{ fontFamily: isAr ? "var(--font-arabic)" : "var(--font-serif)" }}
        >
          {t("hero.title")}
          <br />
          <span className="italic text-[#1B133C]/85">
            {t("hero.titleHighlight")}
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[#1B133C]/65 sm:text-xl"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href={`/${locale}/create`}
            className="group flex items-center gap-3 rounded-2xl bg-[#1B133C] px-8 py-4 text-lg font-bold text-white shadow-[0_12px_32px_rgba(27,19,60,0.25)] transition-transform hover:scale-105"
          >
            {t("hero.ctaPrimary")}
            <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#how-it-works"
            className="flex items-center gap-3 rounded-2xl border border-white/50 bg-white/60 px-8 py-4 text-lg font-semibold text-[#1B133C] backdrop-blur-xl transition-colors hover:bg-white/80"
          >
            {t("hero.ctaSecondary")}
          </a>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={4}
          className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600"
        >
          <CheckCircle className="h-4 w-4" />
          {t("hero.trustBadge")}
        </motion.div>
      </div>
    </section>
  );
}
