"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Store, Zap, BarChart3, Bot, Truck, Share2,
  CheckCircle, ArrowLeft, ArrowRight, Star,
  ShieldCheck, Globe, Sparkles, ChevronDown,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

// ── Animation helpers ──────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

// ── Animated counter ──────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [to]);
  return <>{count.toLocaleString("ar-SA")}{suffix}</>;
}

// ── Feature card ──────────────────────────────────────────
const featureIcons = [Store, BarChart3, BarChart3, Bot, Truck, Share2];
const featureColors = [
  "from-indigo-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-cyan-500 to-blue-500",
  "from-purple-500 to-fuchsia-500",
];

// ── Main component ─────────────────────────────────────────
export default function LandingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const featureKeys = ["easy", "accounting", "analytics", "ai", "delivery", "channels"] as const;
  const pricingFeatures = t.raw("pricing.features") as string[];

  const testimonials = [
    { name: isAr ? "أحمد الشهري" : "Ahmed Al-Shahri", role: isAr ? "صاحب متجر عطور" : "Perfume Store Owner", rating: 5, text: isAr ? "بنيت متجري في أقل من ساعة وبدأت البيع نفس اليوم. أفضل قرار اتخذته!" : "I built my store in less than an hour and started selling the same day. Best decision I made!" },
    { name: isAr ? "سارة المطيري" : "Sara Al-Mutairi", role: isAr ? "بائعة مستلزمات منزلية" : "Home Goods Seller", rating: 5, text: isAr ? "كنت أدفع اشتراكاً شهرياً لمنصة أخرى. الآن أدفع مرة واحدة وأوفر كل شهر." : "I was paying a monthly subscription elsewhere. Now I pay once and save every month." },
    { name: isAr ? "محمد القحطاني" : "Mohammed Al-Qahtani", role: isAr ? "تاجر إلكترونيات" : "Electronics Merchant", rating: 5, text: isAr ? "مساعد الذكاء الاصطناعي يرد على عملائي حتى وأنا نائم. رائع جداً!" : "The AI assistant answers my customers even while I sleep. Absolutely amazing!" },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden" dir={isAr ? "rtl" : "ltr"}>

      {/* ── NAVBAR ────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center glow-brand">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">StoreHub</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {["features", "pricing"].map((key) => (
              <a key={key} href={`#${key}`} className="text-sm text-slate-300 hover:text-white transition-colors">
                {t(`nav.${key}`)}
              </a>
            ))}
            <Link
              href={`/${locale}/login`}
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              {t("nav.login")}
            </Link>
            <Link
              href={`/${locale}/create`}
              className="px-4 py-2 rounded-xl gradient-brand text-sm font-semibold hover:opacity-90 transition-all glow-brand text-white"
            >
              {t("nav.start")}
            </Link>
            {/* Language switch */}
            <Link
              href={isAr ? "/en" : "/ar"}
              className="text-xs glass px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              {isAr ? "EN" : "AR"}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/5 px-4 py-4 space-y-3">
            <Link href={`/${locale}/create`} className="block w-full text-center px-4 py-3 rounded-xl gradient-brand text-sm font-semibold text-white">
              {t("nav.start")}
            </Link>
            <Link href={isAr ? "/en" : "/ar"} className="block text-center text-sm text-slate-300">
              {isAr ? "English" : "العربية"}
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-amber-500/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 glass-brand px-4 py-2 rounded-full text-sm text-indigo-300 font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            {t("hero.badge")}
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-5xl sm:text-6xl md:text-7xl font-black leading-tight mb-6"
          >
            <span className="text-white">{t("hero.title")}</span>
            <br />
            <span className="gradient-text">{t("hero.titleHighlight")}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Link
              href={`/${locale}/create`}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl gradient-brand text-white font-bold text-lg glow-brand hover:scale-105 transition-transform"
            >
              {t("hero.ctaPrimary")}
              <Arrow className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl glass text-slate-200 font-semibold text-lg hover:bg-white/10 transition-all"
            >
              {t("hero.ctaSecondary")}
            </a>
          </motion.div>

          {/* Trust badge */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="flex items-center justify-center gap-2 text-sm text-emerald-400 font-medium"
          >
            <CheckCircle className="w-4 h-4" />
            {t("hero.trustBadge")}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={5}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto"
          >
            {[
              { count: 12500, suffix: "+", label: t("hero.stats.stores") },
              { count: 280000, suffix: "+", label: t("hero.stats.orders") },
              { count: 8400, suffix: "+", label: t("hero.stats.merchants") },
              { count: 99.9, suffix: "%", label: t("hero.stats.uptime") },
            ].map(({ count, suffix, label }) => (
              <div key={label} className="glass rounded-2xl p-5 text-center">
                <div className="text-3xl font-black gradient-text-gold">
                  <Counter to={count} suffix={suffix} />
                </div>
                <div className="text-sm text-slate-400 mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Animated store preview card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative z-10 mt-16 w-full max-w-3xl mx-auto float"
        >
          <div className="glass rounded-3xl p-2 glow-brand">
            {/* Browser chrome */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                <div className="flex-1 mx-4 glass rounded-lg px-3 py-1.5 text-xs text-slate-400 text-center">
                  demo.storehub.sa
                </div>
              </div>
              {/* Store mock content */}
              <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                {/* Store header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-xl" />
                    <div>
                      <div className="text-sm font-bold text-white">متجر التميز</div>
                      <div className="text-xs text-indigo-200">demo.storehub.sa</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/70 text-xs">
                    <span>المنتجات</span>
                    <span>حولنا</span>
                    <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs">3</div>
                  </div>
                </div>
                {/* Product grid */}
                <div className="p-4 grid grid-cols-3 gap-3">
                  {[
                    { name: "عطر الفاخر", price: "٢٥٠", color: "from-amber-500/30 to-orange-500/30" },
                    { name: "ساعة ذهبية", price: "١٢٠٠", color: "from-yellow-500/30 to-amber-500/30" },
                    { name: "حقيبة جلدية", price: "٤٨٠", color: "from-stone-500/30 to-amber-700/30" },
                  ].map((p) => (
                    <div key={p.name} className="glass rounded-xl overflow-hidden">
                      <div className={`h-20 bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl`}>
                        🛍️
                      </div>
                      <div className="p-2">
                        <div className="text-xs text-slate-200 font-medium truncate">{p.name}</div>
                        <div className="text-xs text-amber-400 font-bold">{p.price} ر.س</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              {t("howItWorks.title")}
            </h2>
            <p className="text-slate-400 text-lg">{t("howItWorks.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-1/3 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

            {(["1", "2", "3"] as const).map((step, i) => (
              <motion.div
                key={step}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="glass-brand rounded-3xl p-8 text-center relative"
              >
                <div className="w-14 h-14 gradient-brand rounded-2xl flex items-center justify-center text-2xl font-black text-white mx-auto mb-6 glow-brand">
                  {step}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {t(`howItWorks.steps.${step}.title`)}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {t(`howItWorks.steps.${step}.desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              {t("features.title")}
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureKeys.map((key, i) => {
              const Icon = featureIcons[i];
              return (
                <motion.div
                  key={key}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i % 3}
                  className="glass rounded-3xl p-8 hover:bg-white/5 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${featureColors[i]} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {t(`features.items.${key}.title`)}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {t(`features.items.${key}.desc`)}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI SPOTLIGHT ─────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="glass rounded-3xl p-2 glow-brand"
          >
            <div className="glass rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 text-center md:text-start">
                <div className="inline-flex items-center gap-2 bg-pink-500/15 border border-pink-500/25 rounded-full px-4 py-2 text-sm text-pink-300 font-medium mb-6">
                  <Bot className="w-4 h-4" />
                  {isAr ? "مساعد ذكاء اصطناعي مدمج" : "Built-in AI Assistant"}
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                  {isAr
                    ? "مساعد ذكي يخدم عملاءك على مدار الساعة"
                    : "An AI assistant that serves your customers 24/7"}
                </h2>
                <p className="text-slate-400 leading-relaxed mb-6">
                  {isAr
                    ? "كل متجر يحصل على مساعده الخاص المدرّب على منتجاتك وسياستك. يرد على الأسئلة، يقترح المنتجات، ويتحدث مع عملائك حتى وأنت نائم."
                    : "Every store gets its own assistant trained on your products and policies. It answers questions, suggests products, and chats with your customers even while you sleep."}
                </p>
                <Link href={`/${locale}/create`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 transition-opacity">
                  {isAr ? "جرّب الذكاء الاصطناعي" : "Try the AI"}
                  <Arrow className="w-4 h-4" />
                </Link>
              </div>

              {/* AI chat mock */}
              <div className="w-full md:w-72 glass rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                  <div className="w-8 h-8 gradient-brand rounded-xl flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {isAr ? "مساعد متجرك" : "Store Assistant"}
                  </span>
                  <span className="ms-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                    {isAr ? "متاح" : "Online"}
                  </span>
                </div>
                {[
                  { from: "user",  text: isAr ? "ما هو أفضل عطر عندكم؟" : "What's your best perfume?" },
                  { from: "bot",   text: isAr ? "أنصحك بعطر الفاخر الجديد! مبيعاتنا الأولى هذا الشهر 🌟" : "I recommend our new Luxury perfume! Our #1 seller this month 🌟" },
                  { from: "user",  text: isAr ? "كم سعره؟" : "How much is it?" },
                  { from: "bot",   text: isAr ? "سعره ٢٥٠ ريال فقط مع توصيل مجاني 🎁" : "Only 250 SAR with free delivery 🎁" },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl leading-relaxed ${
                      msg.from === "user"
                        ? "gradient-brand text-white"
                        : "glass text-slate-200"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 rounded-full px-4 py-2 text-sm text-amber-300 font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              {t("pricing.badge")}
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              {t("pricing.title")}
            </h2>
            <p className="text-slate-400 text-lg">{t("pricing.subtitle")}</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={1}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 rounded-3xl blur-xl" />
            <div className="relative glass rounded-3xl p-8 md:p-12 border border-indigo-500/30">
              <div className="text-center mb-8">
                <div className="text-sm text-slate-400 mb-2">{t("pricing.oneTime")}</div>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-7xl font-black gradient-text-gold">٩٩٩</span>
                  <span className="text-2xl text-slate-300">{t("pricing.currency")}</span>
                </div>
                <div className="line-through text-slate-500 text-lg">٢٬٩٩٩ {t("pricing.currency")}</div>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 text-sm px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  {t("pricing.note")}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {pricingFeatures.map((feature: string) => (
                  <div key={feature} className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href={`/${locale}/create`}
                className="group flex items-center justify-center gap-3 w-full py-5 rounded-2xl gradient-brand text-white font-bold text-xl glow-brand hover:scale-[1.02] transition-transform"
              >
                {t("pricing.cta")}
                <Arrow className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              {t("testimonials.title")}
            </h2>
            <p className="text-slate-400 text-lg">{t("testimonials.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="glass rounded-3xl p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed mb-6 text-sm">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center text-sm font-bold text-white">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="relative rounded-3xl overflow-hidden text-center p-12 md:p-16"
          >
            <div className="absolute inset-0 gradient-brand opacity-90" />
            <div className="absolute inset-0 noise" />
            <div className="relative z-10">
              <Globe className="w-12 h-12 text-white/60 mx-auto mb-6" />
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
                {t("cta.title")}
              </h2>
              <p className="text-white/80 text-lg mb-8">{t("cta.subtitle")}</p>
              <Link
                href={`/${locale}/create`}
                className="group inline-flex items-center gap-3 px-10 py-5 bg-white rounded-2xl text-indigo-700 font-black text-xl hover:scale-105 transition-transform shadow-2xl"
              >
                {t("cta.button")}
                <Arrow className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="mt-4 text-sm text-white/60">{t("cta.note")}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="border-t border-white/5 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">StoreHub</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>
            {(["product", "company", "legal"] as const).map((section) => (
              <div key={section}>
                <h4 className="text-sm font-semibold text-white mb-4">
                  {t(`footer.links.${section}`)}
                </h4>
                <ul className="space-y-2">
                  {section === "product" && ["features", "pricing", "demo"].map((link) => (
                    <li key={link}>
                      <a href={`#${link}`} className="text-sm text-slate-400 hover:text-white transition-colors">
                        {t(`footer.links.${link}`)}
                      </a>
                    </li>
                  ))}
                  {section === "company" && ["about", "blog", "support"].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                        {t(`footer.links.${link}`)}
                      </a>
                    </li>
                  ))}
                  {section === "legal" && ["privacy", "terms"].map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                        {t(`footer.links.${link}`)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} StoreHub. {t("footer.rights")}.
            </p>
            <div className="flex items-center gap-4">
              <Link href={isAr ? "/en" : "/ar"} className="text-sm text-slate-500 hover:text-white transition-colors">
                {isAr ? "English" : "العربية"}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
