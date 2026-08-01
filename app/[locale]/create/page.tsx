"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Store, CheckCircle, ArrowLeft, ArrowRight,
  Loader2, AlertCircle, Sparkles, User,
} from "lucide-react";
import { slugify } from "@/utils";

const COLORS = [
  { value: "#4F46E5", label: "Indigo" },
  { value: "#7C3AED", label: "Violet" },
  { value: "#0EA5E9", label: "Sky" },
  { value: "#10B981", label: "Emerald" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Rose" },
];

type Step = "auth" | "info" | "design" | "done";

interface FormData {
  email: string;
  password: string;
  storeName: string;
  storeNameAr: string;
  subdomain: string;
  primaryColor: string;
}

export default function CreatePage() {
  const supabase = createClient();
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const [step, setStep] = useState<Step>("auth");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);

  const [form, setForm] = useState<FormData>({
    email: "",
    password: "",
    storeName: "",
    storeNameAr: "",
    subdomain: "",
    primaryColor: "#4F46E5",
  });

  // Check if already logged in — skip auth step
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setStep("info");
    });
  }, []);

  function update(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "storeName") {
      const slug = slugify(value);
      setForm((f) => ({ ...f, storeName: value, subdomain: slug }));
      if (slug.length >= 3) checkSubdomain(slug);
    }
    if (field === "subdomain") {
      const slug = slugify(value);
      setForm((f) => ({ ...f, subdomain: slug }));
      if (slug.length >= 3) checkSubdomain(slug);
    }
  }

  async function checkSubdomain(sub: string) {
    setChecking(true);
    setSubdomainAvailable(null);
    const { data } = await supabase
      .from("stores")
      .select("id")
      .eq("subdomain", sub)
      .maybeSingle();
    setSubdomainAvailable(!data);
    setChecking(false);
  }

  // Step 0: Sign up
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (error) {
      // Try sign in if account exists
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) {
        setError(isAr ? "حدث خطأ. تأكد من البريد وكلمة المرور." : "Check your email and password.");
        setLoading(false);
        return;
      }
    }

    setStep("info");
    setLoading(false);
  }

  // Step 1: Store info validated
  async function handleInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!form.storeName || form.subdomain.length < 3) {
      setError(isAr ? "أدخل اسم المتجر والرابط" : "Enter store name and URL");
      return;
    }
    if (subdomainAvailable === false) {
      setError(isAr ? "الرابط مستخدم، اختر رابطاً آخر" : "URL is taken, choose another");
      return;
    }
    setError(null);
    setStep("design");
  }

  // Final: Create store
  async function handleCreate() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    const { error } = await supabase.from("stores").insert({
      name: form.storeName,
      name_ar: form.storeNameAr || form.storeName,
      subdomain: form.subdomain,
      primary_color: form.primaryColor,
      owner_id: user.id,
      country: "SA",
      currency: "SAR",
      is_active: true,
      ai_enabled: true,
    });

    if (error) {
      setError(isAr ? "حدث خطأ أثناء الإنشاء" : "Error creating store");
      setLoading(false);
      return;
    }

    setStep("done");
    setLoading(false);
  }

  const steps: Step[] = ["auth", "info", "design", "done"];
  const stepIndex = steps.indexOf(step);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">StoreHub</span>
          </Link>

          {step !== "done" && (
            <>
              <h1 className="text-2xl font-black text-white mb-1">
                {isAr ? "أنشئ متجرك الآن" : "Create your store"}
              </h1>
              <p className="text-slate-400 text-sm">
                {isAr ? "ثلاث خطوات وتكون جاهزاً للبيع" : "Three steps and you're ready to sell"}
              </p>
            </>
          )}
        </div>

        {/* Progress dots */}
        {step !== "done" && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {["auth", "info", "design"].map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i <= stepIndex ? "bg-indigo-500 w-8" : "bg-white/10 w-4"
                }`}
              />
            ))}
          </div>
        )}

        <div className="glass rounded-3xl p-8">
          {/* ── STEP 0: AUTH ── */}
          {step === "auth" && (
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {isAr ? "أنشئ حسابك" : "Create your account"}
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {isAr ? "كلمة المرور" : "Password"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="8+ characters"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold glow-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>{isAr ? "التالي" : "Next"} <Arrow className="w-4 h-4" /></>
                )}
              </button>

              <p className="text-center text-sm text-slate-500">
                {isAr ? "لديك حساب؟ " : "Have an account? "}
                <Link href={`/${locale}/login`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                  {isAr ? "تسجيل الدخول" : "Sign in"}
                </Link>
              </p>
            </form>
          )}

          {/* ── STEP 1: STORE INFO ── */}
          {step === "info" && (
            <form onSubmit={handleInfo} className="space-y-5">
              <div className="text-center mb-6">
                <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {isAr ? "معلومات متجرك" : "Store information"}
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {isAr ? "اسم المتجر" : "Store name"}
                </label>
                <input
                  value={form.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder={isAr ? "متجر العطور" : "My Awesome Store"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {isAr ? "اسم المتجر بالعربية" : "Store name in Arabic"}
                  <span className="text-slate-500 font-normal ms-2">{isAr ? "(اختياري)" : "(optional)"}</span>
                </label>
                <input
                  value={form.storeNameAr}
                  onChange={(e) => update("storeNameAr", e.target.value)}
                  dir="rtl"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="متجر العطور الفاخرة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {isAr ? "رابط المتجر" : "Store URL"}
                </label>
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-500 transition-colors">
                  <input
                    value={form.subdomain}
                    onChange={(e) => update("subdomain", e.target.value)}
                    required
                    minLength={3}
                    maxLength={30}
                    dir="ltr"
                    className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none"
                    placeholder="my-store"
                  />
                  <span className="text-slate-400 text-sm whitespace-nowrap">.storehub.sa</span>
                  {checking && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  {!checking && subdomainAvailable === true && (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                  {!checking && subdomainAvailable === false && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                {subdomainAvailable === false && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {isAr ? "هذا الرابط مستخدم" : "This URL is already taken"}
                  </p>
                )}
                {subdomainAvailable === true && (
                  <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {isAr ? "الرابط متاح!" : "URL is available!"}
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={subdomainAvailable === false}
                className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold glow-brand hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isAr ? "التالي" : "Next"} <Arrow className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ── STEP 2: DESIGN ── */}
          {step === "design" && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {isAr ? "شخصية متجرك" : "Store identity"}
                </h2>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {isAr ? "اللون الرئيسي" : "Primary color"}
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => update("primaryColor", c.value)}
                      className={`w-10 h-10 rounded-xl transition-transform hover:scale-110 ${
                        form.primaryColor === c.value ? "ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110" : ""
                      }`}
                      style={{ backgroundColor: c.value }}
                      aria-label={c.label}
                    />
                  ))}
                  <label className="w-10 h-10 rounded-xl border border-white/20 flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors overflow-hidden">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className="opacity-0 absolute w-px h-px"
                    />
                    <span className="text-xs text-slate-400">+</span>
                  </label>
                </div>
              </div>

              {/* Preview */}
              <div className="glass rounded-2xl p-4">
                <div
                  className="rounded-xl p-3 mb-3 flex items-center gap-2"
                  style={{ backgroundColor: form.primaryColor }}
                >
                  <div className="w-7 h-7 bg-white/20 rounded-lg" />
                  <div>
                    <div className="text-xs font-bold text-white">{form.storeName || "اسم المتجر"}</div>
                    <div className="text-xs text-white/70">{form.subdomain}.storehub.sa</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["منتج ١", "منتج ٢", "منتج ٣"].map((p) => (
                    <div key={p} className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="w-full aspect-square rounded-md mb-1" style={{ backgroundColor: form.primaryColor + "33" }} />
                      <p className="text-xs text-slate-300">{p}</p>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="flex-1 py-3 rounded-xl glass text-slate-200 font-medium hover:bg-white/10 transition-all"
                >
                  {isAr ? "السابق" : "Back"}
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-2 flex-grow py-3 rounded-xl gradient-brand text-white font-semibold glow-brand hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {isAr ? "جاري الإنشاء..." : "Creating..."}</>
                  ) : (
                    <>{isAr ? "أنشئ متجري" : "Create my store"} 🚀</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                {isAr ? "تم إنشاء متجرك! 🎉" : "Your store is live! 🎉"}
              </h2>
              <p className="text-slate-400 text-sm mb-8">
                {isAr
                  ? `متجرك جاهز على ${form.subdomain}.storehub.sa`
                  : `Your store is ready at ${form.subdomain}.storehub.sa`}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/${locale}/admin`)}
                  className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold glow-brand hover:opacity-90 flex items-center justify-center gap-2"
                >
                  {isAr ? "الذهاب للوحة التحكم" : "Go to dashboard"}
                  <Arrow className="w-4 h-4" />
                </button>
                <a
                  href={`https://${form.subdomain}.storehub.sa`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl glass text-slate-200 font-medium hover:bg-white/10 transition-all"
                >
                  {isAr ? "عرض المتجر" : "View store"} ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
