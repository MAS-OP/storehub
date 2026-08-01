#!/bin/bash
set -e
echo "🚀 StoreHub — جاري إنشاء الملفات (18 ملف)..."

mkdir -p "app/api/ai"
cat > "app/api/ai/route.ts" << 'STOREHUB_MARKER'
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/supabase/server";

const anthropic = new Anthropic();

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    const {
      message,
      storeId,
      history = [],
    }: { message: string; storeId: string; history: Message[] } =
      await request.json();

    if (!message || !storeId) {
      return Response.json(
        { error: "Missing message or storeId" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: store } = await supabase
      .from("stores")
      .select("name, name_ar, ai_personality, products(name, name_ar, price, stock, is_active)")
      .eq("id", storeId)
      .eq("is_active", true)
      .single();

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 404 });
    }

    type Product = { name: string; name_ar: string | null; price: number; stock: number; is_active: boolean };
    const active = (store.products as Product[]).filter((p) => p.is_active);

    const systemPrompt = [
      store.ai_personality ?? "أنا مساعد متجر ودود ومحترف يساعد العملاء في إيجاد ما يحتاجونه",
      "",
      `اسم المتجر: ${store.name_ar ?? store.name}`,
      "",
      "المنتجات المتاحة:",
      ...active.map(
        (p) =>
          `- ${p.name_ar ?? p.name}: ${p.price} ريال (${p.stock > 0 ? "متوفر" : "نفذ المخزون"})`
      ),
      "",
      "تحدث بود ومهنية. إذا سئلت عن منتج غير موجود في القائمة، أخبر العميل بلطف.",
    ].join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        ...history.slice(-10), // keep last 10 messages for context
        { role: "user", content: message },
      ],
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({ reply });
  } catch (error) {
    console.error("AI route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
STOREHUB_MARKER
echo "  ✅ app/api/ai/route.ts"

mkdir -p "app/api/auth/signout"
cat > "app/api/auth/signout/route.ts" << 'STOREHUB_MARKER'
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ar/login");
}
STOREHUB_MARKER
echo "  ✅ app/api/auth/signout/route.ts"

mkdir -p "app/[locale]/login"
cat > "app/[locale]/login/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useState } from "react";
import { createClient } from "@/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Store, ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        isAr
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : "Incorrect email or password"
      );
      setLoading(false);
      return;
    }

    router.push(`/${locale}/admin`);
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Background glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center glow-brand">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">StoreHub</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">
            {isAr ? "مرحباً بعودتك" : "Welcome back"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isAr ? "سجّل الدخول لإدارة متجرك" : "Sign in to manage your store"}
          </p>
        </div>

        {/* Form card */}
        <div className="glass rounded-3xl p-8">
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {isAr ? "البريد الإلكتروني" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder={isAr ? "example@email.com" : "you@email.com"}
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {isAr ? "كلمة المرور" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="••••••••"
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
              className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold text-base glow-brand hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isAr ? "تسجيل الدخول" : "Sign in"}
                  <Arrow className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isAr ? "ليس لديك حساب؟ " : "Don't have an account? "}
            <Link
              href={`/${locale}/create`}
              className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
            >
              {isAr ? "ابنِ متجرك الآن" : "Build your store"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/login/page.tsx"

mkdir -p "app/[locale]/create"
cat > "app/[locale]/create/page.tsx" << 'STOREHUB_MARKER'
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
STOREHUB_MARKER
echo "  ✅ app/[locale]/create/page.tsx"

mkdir -p "app/[locale]/admin"
cat > "app/[locale]/admin/layout.tsx" << 'STOREHUB_MARKER'
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Store, LayoutDashboard, Package, ShoppingBag,
  BarChart3, Calculator, Settings, Bot, ExternalLink, LogOut,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, name_ar, subdomain, primary_color, logo_url")
    .eq("owner_id", user.id)
    .single();

  if (!store) redirect(`/${locale}/create`);

  const navItems = [
    { href: `/${locale}/admin`, icon: LayoutDashboard, label: isAr ? "لوحة التحكم" : "Dashboard" },
    { href: `/${locale}/admin/products`, icon: Package, label: isAr ? "المنتجات" : "Products" },
    { href: `/${locale}/admin/orders`, icon: ShoppingBag, label: isAr ? "الطلبات" : "Orders" },
    { href: `/${locale}/admin/analytics`, icon: BarChart3, label: isAr ? "التحليلات" : "Analytics" },
    { href: `/${locale}/admin/accounting`, icon: Calculator, label: isAr ? "المحاسبة" : "Accounting" },
    { href: `/${locale}/admin/settings`, icon: Settings, label: isAr ? "الإعدادات" : "Settings" },
    { href: `/${locale}/admin/ai`, icon: Bot, label: isAr ? "مساعد الذكاء" : "AI Assistant" },
  ];

  return (
    <div className="flex min-h-screen" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Sidebar ── */}
      <aside className="w-64 glass border-e border-white/5 flex flex-col fixed inset-y-0 start-0 z-30">
        {/* Store identity */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: store.primary_color }}
            >
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Store className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {isAr ? (store.name_ar ?? store.name) : store.name}
              </p>
              <p className="text-xs text-slate-400 truncate">{store.subdomain}.storehub.sa</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all group"
              >
                <Icon className="w-4 h-4 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 space-y-0.5">
          <a
            href={`https://${store.subdomain}.storehub.sa`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            {isAr ? "عرض المتجر" : "View store"}
          </a>
          <form action={`/api/auth/signout`} method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              {isAr ? "تسجيل الخروج" : "Sign out"}
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 ms-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/layout.tsx"

mkdir -p "app/[locale]/admin"
cat > "app/[locale]/admin/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { TrendingUp, ShoppingBag, Package, Users, ArrowUpRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils";
import type { Database } from "@/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

interface Stats {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
}

export default function AdminDashboard() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [stats, setStats] = useState<Stats>({ revenue: 0, orders: 0, products: 0, customers: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<(Product & { sold: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (!store) return;

    const storeId = store.id;

    // Fetch stats in parallel
    const [ordersRes, productsRes, recentRes] = await Promise.all([
      supabase.from("orders").select("total, payment_status, customer_email").eq("store_id", storeId),
      supabase.from("products").select("*").eq("store_id", storeId).eq("is_active", true),
      supabase.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }).limit(8),
    ]);

    const orders = ordersRes.data ?? [];
    const revenue = orders.filter(o => o.payment_status === "paid").reduce((sum, o) => sum + o.total, 0);
    const uniqueCustomers = new Set(orders.map(o => o.customer_email)).size;

    setStats({
      revenue,
      orders: orders.length,
      products: productsRes.data?.length ?? 0,
      customers: uniqueCustomers,
    });
    setRecentOrders(recentRes.data ?? []);
    setLoading(false);
  }

  const statCards = [
    { icon: TrendingUp, label: isAr ? "إجمالي الإيرادات" : "Total Revenue", value: formatCurrency(stats.revenue, "SAR", isAr ? "ar-SA" : "en-US"), color: "from-indigo-500 to-violet-500" },
    { icon: ShoppingBag, label: isAr ? "إجمالي الطلبات" : "Total Orders", value: stats.orders.toLocaleString(), color: "from-amber-500 to-orange-500" },
    { icon: Package, label: isAr ? "المنتجات النشطة" : "Active Products", value: stats.products.toLocaleString(), color: "from-emerald-500 to-teal-500" },
    { icon: Users, label: isAr ? "العملاء" : "Customers", value: stats.customers.toLocaleString(), color: "from-pink-500 to-rose-500" },
  ];

  const statusLabel: Record<string, string> = {
    pending: isAr ? "قيد الانتظار" : "Pending",
    confirmed: isAr ? "مؤكد" : "Confirmed",
    processing: isAr ? "قيد التجهيز" : "Processing",
    shipped: isAr ? "تم الشحن" : "Shipped",
    delivered: isAr ? "تم التسليم" : "Delivered",
    cancelled: isAr ? "ملغي" : "Cancelled",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400",
    confirmed: "bg-blue-500/15 text-blue-400",
    processing: "bg-indigo-500/15 text-indigo-400",
    shipped: "bg-violet-500/15 text-violet-400",
    delivered: "bg-emerald-500/15 text-emerald-400",
    cancelled: "bg-red-500/15 text-red-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">{isAr ? "لوحة التحكم" : "Dashboard"}</h1>
        <p className="text-slate-400 text-sm mt-1">{isAr ? "نظرة عامة على متجرك" : "Overview of your store"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-slate-400 text-xs mb-1">{card.label}</p>
              <p className="text-2xl font-black text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent orders */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">{isAr ? "آخر الطلبات" : "Recent orders"}</h2>
          <a href={`/${locale}/admin/orders`} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            {isAr ? "عرض الكل" : "View all"} <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  isAr ? "رقم الطلب" : "Order",
                  isAr ? "العميل" : "Customer",
                  isAr ? "المجموع" : "Total",
                  isAr ? "الحالة" : "Status",
                  isAr ? "التاريخ" : "Date",
                ].map((h) => (
                  <th key={h} className="px-6 py-3 text-start text-xs font-medium text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                    {isAr ? "لا توجد طلبات بعد" : "No orders yet"}
                  </td>
                </tr>
              ) : recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-300">{order.order_number}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{order.customer_name}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">
                    {formatCurrency(order.total, "SAR", isAr ? "ar-SA" : "en-US")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[order.status] ?? ""}`}>
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {formatDate(order.created_at, isAr ? "ar-SA" : "en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/page.tsx"

mkdir -p "app/[locale]/admin/products"
cat > "app/[locale]/admin/products/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import {
  Plus, Pencil, Trash2, X, Loader2, Package,
  ToggleLeft, ToggleRight, CheckCircle, AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/utils";
import type { Database } from "@/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

const empty: Omit<ProductInsert, "store_id"> = {
  name: "", name_ar: "", description: "", description_ar: "",
  price: 0, compare_price: null, stock: 0, sku: null,
  images: [], is_active: true, category_id: null, weight: null,
};

export default function ProductsPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  useEffect(() => { loadProducts(); }, []);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
    if (!store) return;
    setStoreId(store.id);
    const { data } = await supabase.from("products").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }

  function openAdd() { setForm(empty); setEditId(null); setModal("add"); }
  function openEdit(p: Product) {
    setForm({
      name: p.name, name_ar: p.name_ar ?? "", description: p.description ?? "",
      description_ar: p.description_ar ?? "", price: p.price, compare_price: p.compare_price,
      stock: p.stock, sku: p.sku, images: p.images, is_active: p.is_active,
      category_id: p.category_id, weight: p.weight,
    });
    setEditId(p.id);
    setModal("edit");
  }

  async function handleSave() {
    if (!storeId || !form.name || form.price < 0) return;
    setSaving(true);
    if (modal === "add") {
      const { error } = await supabase.from("products").insert({ ...form, store_id: storeId });
      if (error) showToast(isAr ? "حدث خطأ" : "Error saving", "err");
      else showToast(isAr ? "تم إضافة المنتج" : "Product added", "ok");
    } else if (editId) {
      const { error } = await supabase.from("products").update(form).eq("id", editId);
      if (error) showToast(isAr ? "حدث خطأ" : "Error updating", "err");
      else showToast(isAr ? "تم التحديث" : "Product updated", "ok");
    }
    setSaving(false);
    setModal(null);
    loadProducts();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) showToast(isAr ? "حدث خطأ" : "Error deleting", "err");
    else { showToast(isAr ? "تم الحذف" : "Deleted", "ok"); setDeleteId(null); loadProducts(); }
  }

  async function toggleActive(p: Product) {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    loadProducts();
  }

  const f = (field: keyof typeof form, val: unknown) => setForm((prev) => ({ ...prev, [field]: val }));

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl" dir={isAr ? "rtl" : "ltr"}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 end-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.type === "ok" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {toast.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">{isAr ? "المنتجات" : "Products"}</h1>
          <p className="text-slate-400 text-sm mt-1">{products.length} {isAr ? "منتج" : "products"}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm glow-brand hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          {isAr ? "إضافة منتج" : "Add product"}
        </button>
      </div>

      {/* Products table */}
      {products.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{isAr ? "لا توجد منتجات بعد" : "No products yet"}</p>
          <button onClick={openAdd} className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold">
            {isAr ? "أضف منتجك الأول" : "Add your first product"}
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {[isAr ? "المنتج" : "Product", isAr ? "السعر" : "Price", isAr ? "المخزون" : "Stock", isAr ? "الحالة" : "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-start text-xs font-medium text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : <Package className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{isAr ? (p.name_ar ?? p.name) : p.name}</p>
                        {p.sku && <p className="text-xs text-slate-500">SKU: {p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-white">{formatCurrency(p.price, "SAR", isAr ? "ar-SA" : "en-US")}</p>
                    {p.compare_price && <p className="text-xs text-slate-500 line-through">{formatCurrency(p.compare_price, "SAR", isAr ? "ar-SA" : "en-US")}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${p.stock > 0 ? "text-white" : "text-red-400"}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleActive(p)} className="flex items-center gap-1.5 text-xs">
                      {p.is_active ? (
                        <><ToggleRight className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400">{isAr ? "نشط" : "Active"}</span></>
                      ) : (
                        <><ToggleLeft className="w-5 h-5 text-slate-500" /><span className="text-slate-500">{isAr ? "مخفي" : "Hidden"}</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-lg glass rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {modal === "add" ? (isAr ? "إضافة منتج" : "Add product") : (isAr ? "تعديل المنتج" : "Edit product")}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "الاسم بالعربية *" : "Name (Arabic) *"}</label>
                  <input value={form.name_ar ?? ""} onChange={(e) => f("name_ar", e.target.value)} dir="rtl" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="عطر الفاخر" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "الاسم بالإنجليزية *" : "Name (English) *"}</label>
                  <input value={form.name} onChange={(e) => f("name", e.target.value)} dir="ltr" required className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Luxury Perfume" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "الوصف بالعربية" : "Description (Arabic)"}</label>
                <textarea value={form.description_ar ?? ""} onChange={(e) => f("description_ar", e.target.value)} dir="rtl" rows={2} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="وصف المنتج..." />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "السعر (ر.س) *" : "Price (SAR) *"}</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => f("price", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "السعر الأصلي" : "Compare price"}</label>
                  <input type="number" min="0" step="0.01" value={form.compare_price ?? ""} onChange={(e) => f("compare_price", e.target.value ? parseFloat(e.target.value) : null)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "المخزون *" : "Stock *"}</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => f("stock", parseInt(e.target.value) || 0)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "رابط الصورة الرئيسية" : "Main image URL"}</label>
                <input value={form.images[0] ?? ""} onChange={(e) => f("images", e.target.value ? [e.target.value] : [])} dir="ltr" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">SKU ({isAr ? "اختياري" : "optional"})</label>
                <input value={form.sku ?? ""} onChange={(e) => f("sku", e.target.value || null)} dir="ltr" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="PRD-001" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => f("is_active", e.target.checked)} className="sr-only" />
                <div className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? "bg-indigo-500" : "bg-white/10"} flex items-center px-0.5`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-slate-300">{isAr ? "منتج نشط (ظاهر للعملاء)" : "Active (visible to customers)"}</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl glass text-slate-300 font-medium hover:bg-white/5 transition-all">{isAr ? "إلغاء" : "Cancel"}</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 rounded-xl gradient-brand text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "حفظ" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 glass rounded-2xl p-6 w-full max-w-sm text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">{isAr ? "حذف المنتج؟" : "Delete product?"}</h3>
            <p className="text-slate-400 text-sm mb-6">{isAr ? "هذا الإجراء لا يمكن التراجع عنه." : "This action cannot be undone."}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl glass text-slate-300 font-medium">{isAr ? "إلغاء" : "Cancel"}</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">{isAr ? "حذف" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/products/page.tsx"

mkdir -p "app/[locale]/admin/orders"
cat > "app/[locale]/admin/orders/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils";
import type { Database } from "@/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Status = Order["status"];

const STATUSES: Status[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [storeId, setStoreId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
    if (!store) return;
    setStoreId(store.id);
    const { data } = await supabase.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: Status) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  }

  const statusLabels: Record<Status | "all", string> = {
    all: isAr ? "الكل" : "All",
    pending: isAr ? "قيد الانتظار" : "Pending",
    confirmed: isAr ? "مؤكد" : "Confirmed",
    processing: isAr ? "قيد التجهيز" : "Processing",
    shipped: isAr ? "تم الشحن" : "Shipped",
    delivered: isAr ? "تم التسليم" : "Delivered",
    cancelled: isAr ? "ملغي" : "Cancelled",
  };

  const statusColors: Record<Status, string> = {
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    processing: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
    shipped: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const countByStatus = (s: Status | "all") =>
    s === "all" ? orders.length : orders.filter((o) => o.status === s).length;

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">{isAr ? "الطلبات" : "Orders"}</h1>
        <p className="text-slate-400 text-sm mt-1">{orders.length} {isAr ? "طلب إجمالاً" : "total orders"}</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
              filter === s
                ? "gradient-brand text-white"
                : "glass text-slate-400 hover:text-white"
            }`}
          >
            {statusLabels[s]}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === s ? "bg-white/20 text-white" : "bg-white/5 text-slate-500"}`}>
              {countByStatus(s)}
            </span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">{isAr ? "لا توجد طلبات" : "No orders found"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="glass rounded-2xl overflow-hidden">
              {/* Order header row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/2 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-mono font-semibold text-white">{order.order_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    {order.payment_status === "paid" && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {isAr ? "مدفوع" : "Paid"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.customer_name} · {formatDate(order.created_at, isAr ? "ar-SA" : "en-US")}
                  </p>
                </div>
                <div className="text-end flex-shrink-0">
                  <p className="text-base font-bold text-white">{formatCurrency(order.total, "SAR", isAr ? "ar-SA" : "en-US")}</p>
                </div>
                {expandedId === order.id ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </div>

              {/* Expanded details */}
              {expandedId === order.id && (
                <div className="border-t border-white/5 px-5 py-4 space-y-4">
                  {/* Customer info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">{isAr ? "العميل" : "Customer"}</p>
                      <p className="text-white font-medium">{order.customer_name}</p>
                      <p className="text-slate-400">{order.customer_email}</p>
                      {order.customer_phone && <p className="text-slate-400">{order.customer_phone}</p>}
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">{isAr ? "عنوان الشحن" : "Shipping address"}</p>
                      {order.shipping_address && typeof order.shipping_address === "object" && (
                        <div className="text-slate-300 text-xs space-y-0.5">
                          {Object.entries(order.shipping_address as Record<string, string>).map(([k, v]) => (
                            <p key={k}>{v}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order financials */}
                  <div className="bg-white/3 rounded-xl p-3 text-sm space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                      <span>{formatCurrency(order.subtotal, "SAR", isAr ? "ar-SA" : "en-US")}</span>
                    </div>
                    {order.shipping_fee > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>{isAr ? "الشحن" : "Shipping"}</span>
                        <span>{formatCurrency(order.shipping_fee, "SAR", isAr ? "ar-SA" : "en-US")}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>{isAr ? "خصم" : "Discount"}</span>
                        <span>-{formatCurrency(order.discount, "SAR", isAr ? "ar-SA" : "en-US")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold pt-1 border-t border-white/5">
                      <span>{isAr ? "الإجمالي" : "Total"}</span>
                      <span>{formatCurrency(order.total, "SAR", isAr ? "ar-SA" : "en-US")}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{isAr ? "ملاحظات العميل" : "Customer notes"}</p>
                      <p className="text-sm text-slate-300 bg-white/3 rounded-xl p-3">{order.notes}</p>
                    </div>
                  )}

                  {/* Status update */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">{isAr ? "تحديث الحالة" : "Update status"}</p>
                    <div className="flex gap-2 flex-wrap">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(order.id, s)}
                          disabled={order.status === s}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-40 ${
                            order.status === s
                              ? statusColors[s]
                              : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {statusLabels[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/orders/page.tsx"

mkdir -p "app/[locale]/admin/analytics"
cat > "app/[locale]/admin/analytics/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingBag, Eye } from "lucide-react";
import { formatCurrency } from "@/utils";

interface DayRevenue {
  date: string;
  revenue: number;
  orders: number;
}
interface TopProduct {
  name: string;
  sold: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [revenueData, setRevenueData] = useState<DayRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pageViews, setPageViews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  async function loadAnalytics() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
    if (!store) return;
    const storeId = store.id;

    // Fetch last 30 days of orders
    const since = new Date();
    since.setDate(since.getDate() - 29);

    const [ordersRes, itemsRes, eventsRes] = await Promise.all([
      supabase.from("orders")
        .select("created_at, total, payment_status")
        .eq("store_id", storeId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true }),
      supabase.from("order_items")
        .select("product_name, price, quantity, subtotal, order_id")
        .in("order_id", (await supabase.from("orders").select("id").eq("store_id", storeId)).data?.map(o => o.id) ?? []),
      supabase.from("analytics_events")
        .select("event_type")
        .eq("store_id", storeId)
        .eq("event_type", "page_view"),
    ]);

    const orders = ordersRes.data ?? [];
    const items = itemsRes.data ?? [];

    // Build daily revenue data
    const byDay: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { revenue: 0, orders: 0 };
    }
    orders.forEach((o) => {
      const key = o.created_at.slice(0, 10);
      if (byDay[key]) {
        byDay[key].orders += 1;
        if (o.payment_status === "paid") byDay[key].revenue += o.total;
      }
    });

    const chartData: DayRevenue[] = Object.entries(byDay).map(([date, v]) => ({
      date: date.slice(5),
      ...v,
    }));

    // Top products by revenue
    const productMap: Record<string, { sold: number; revenue: number }> = {};
    items.forEach((item) => {
      const key = item.product_name;
      if (!productMap[key]) productMap[key] = { sold: 0, revenue: 0 };
      productMap[key].sold += item.quantity;
      productMap[key].revenue += item.subtotal;
    });
    const top = Object.entries(productMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    setRevenueData(chartData);
    setTopProducts(top);
    setTotalRevenue(orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total, 0));
    setTotalOrders(orders.length);
    setPageViews(eventsRes.data?.length ?? 0);
    setLoading(false);
  }

  const tooltipStyle = {
    backgroundColor: "#0b1225",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color: "#f1f5f9",
    fontSize: "12px",
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">{isAr ? "التحليلات" : "Analytics"}</h1>
        <p className="text-slate-400 text-sm mt-1">{isAr ? "آخر 30 يوماً" : "Last 30 days"}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: TrendingUp, label: isAr ? "الإيرادات" : "Revenue", value: formatCurrency(totalRevenue, "SAR", isAr ? "ar-SA" : "en-US"), color: "from-indigo-500 to-violet-500" },
          { icon: ShoppingBag, label: isAr ? "الطلبات" : "Orders", value: totalOrders.toString(), color: "from-amber-500 to-orange-500" },
          { icon: Eye, label: isAr ? "مشاهدات" : "Page views", value: pageViews.toString(), color: "from-emerald-500 to-teal-500" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="glass rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs text-slate-400 mb-1">{c.label}</p>
              <p className="text-xl font-black text-white">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-6">{isAr ? "الإيرادات اليومية" : "Daily revenue"}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={revenueData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v, "SAR", isAr ? "ar-SA" : "en-US"), isAr ? "الإيرادات" : "Revenue"]} />
            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#6366f1" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top products chart */}
      {topProducts.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-6">{isAr ? "أكثر المنتجات مبيعاً" : "Top selling products"}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v, "SAR", isAr ? "ar-SA" : "en-US"), isAr ? "الإيرادات" : "Revenue"]} />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/analytics/page.tsx"

mkdir -p "app/[locale]/admin/accounting"
cat > "app/[locale]/admin/accounting/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { Calculator, Download } from "lucide-react";
import { formatCurrency } from "@/utils";

interface MonthRow {
  monthKey: string;
  label: string;
  revenue: number;
  orders: number;
  refunds: number;
  net: number;
}

export default function AccountingPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [rows, setRows] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAccounting(); }, []);

  async function loadAccounting() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
    if (!store) return;

    const { data: orders } = await supabase
      .from("orders")
      .select("created_at, total, payment_status")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (!orders) { setLoading(false); return; }

    // Group by month
    const map: Record<string, { revenue: number; orders: number; refunds: number }> = {};
    orders.forEach((o) => {
      const key = o.created_at.slice(0, 7); // "YYYY-MM"
      if (!map[key]) map[key] = { revenue: 0, orders: 0, refunds: 0 };
      map[key].orders += 1;
      if (o.payment_status === "paid") map[key].revenue += o.total;
      if (o.payment_status === "refunded") map[key].refunds += o.total;
    });

    const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const enMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    const result: MonthRow[] = Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, v]) => {
        const [year, month] = key.split("-");
        const mi = parseInt(month) - 1;
        return {
          monthKey: key,
          label: isAr ? `${months[mi]} ${year}` : `${enMonths[mi]} ${year}`,
          revenue: v.revenue,
          orders: v.orders,
          refunds: v.refunds,
          net: v.revenue - v.refunds,
        };
      });

    setRows(result);
    setLoading(false);
  }

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const totalRefunds = rows.reduce((s, r) => s + r.refunds, 0);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);

  function exportCSV() {
    const headers = isAr
      ? ["الشهر", "الإيرادات", "الطلبات", "المسترجع", "الصافي"]
      : ["Month", "Revenue", "Orders", "Refunds", "Net"];
    const csv = [
      headers.join(","),
      ...rows.map((r) => [r.label, r.revenue, r.orders, r.refunds, r.net].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "accounting.csv";
    a.click();
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">{isAr ? "المحاسبة" : "Accounting"}</h1>
          <p className="text-slate-400 text-sm mt-1">{isAr ? "ملخص الإيرادات الشهري" : "Monthly revenue summary"}</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-slate-300 text-sm font-medium hover:text-white transition-colors">
          <Download className="w-4 h-4" />
          {isAr ? "تصدير CSV" : "Export CSV"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: isAr ? "إجمالي الإيرادات" : "Total revenue", value: formatCurrency(totalRevenue, "SAR", isAr ? "ar-SA" : "en-US"), color: "text-emerald-400" },
          { label: isAr ? "إجمالي الطلبات" : "Total orders", value: totalOrders.toLocaleString(), color: "text-white" },
          { label: isAr ? "المسترجع" : "Refunded", value: formatCurrency(totalRefunds, "SAR", isAr ? "ar-SA" : "en-US"), color: "text-red-400" },
          { label: isAr ? "الصافي" : "Net income", value: formatCurrency(totalNet, "SAR", isAr ? "ar-SA" : "en-US"), color: "text-indigo-400" },
        ].map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">{c.label}</p>
            <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly table */}
      {rows.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Calculator className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">{isAr ? "لا توجد بيانات بعد" : "No data yet"}</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {[
                  isAr ? "الشهر" : "Month",
                  isAr ? "الإيرادات" : "Revenue",
                  isAr ? "الطلبات" : "Orders",
                  isAr ? "المسترجع" : "Refunded",
                  isAr ? "الصافي" : "Net",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 text-start text-xs font-medium text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.monthKey} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-white">{row.label}</td>
                  <td className="px-5 py-4 text-sm text-emerald-400 font-semibold">{formatCurrency(row.revenue, "SAR", isAr ? "ar-SA" : "en-US")}</td>
                  <td className="px-5 py-4 text-sm text-slate-300">{row.orders}</td>
                  <td className="px-5 py-4 text-sm text-red-400">{row.refunds > 0 ? formatCurrency(row.refunds, "SAR", isAr ? "ar-SA" : "en-US") : "—"}</td>
                  <td className="px-5 py-4 text-sm font-bold text-white">{formatCurrency(row.net, "SAR", isAr ? "ar-SA" : "en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/accounting/page.tsx"

mkdir -p "app/[locale]/admin/settings"
cat > "app/[locale]/admin/settings/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { Loader2, CheckCircle, AlertCircle, Bot } from "lucide-react";
import type { Database } from "@/supabase/types";

type Store = Database["public"]["Tables"]["stores"]["Row"];

const COLORS = ["#4F46E5","#7C3AED","#0EA5E9","#10B981","#F59E0B","#EF4444","#EC4899","#14B8A6"];

export default function SettingsPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [store, setStore] = useState<Store | null>(null);
  const [form, setForm] = useState({ name: "", name_ar: "", description: "", description_ar: "", phone: "", email: "", primary_color: "#4F46E5", logo_url: "", ai_personality: "", ai_enabled: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { loadStore(); }, []);

  async function loadStore() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("stores").select("*").eq("owner_id", user.id).single();
    if (data) {
      setStore(data);
      setForm({
        name: data.name,
        name_ar: data.name_ar ?? "",
        description: data.description ?? "",
        description_ar: data.description_ar ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        primary_color: data.primary_color,
        logo_url: data.logo_url ?? "",
        ai_personality: data.ai_personality ?? "",
        ai_enabled: data.ai_enabled,
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      name: form.name,
      name_ar: form.name_ar || null,
      description: form.description || null,
      description_ar: form.description_ar || null,
      phone: form.phone || null,
      email: form.email || null,
      primary_color: form.primary_color,
      logo_url: form.logo_url || null,
      ai_personality: form.ai_personality || null,
      ai_enabled: form.ai_enabled,
    }).eq("id", store.id);

    setSaving(false);
    if (error) {
      setToast({ msg: isAr ? "حدث خطأ أثناء الحفظ" : "Error saving settings", ok: false });
    } else {
      setToast({ msg: isAr ? "تم حفظ الإعدادات" : "Settings saved", ok: true });
    }
    setTimeout(() => setToast(null), 3000);
  }

  const f = (field: keyof typeof form, val: string | boolean) =>
    setForm((p) => ({ ...p, [field]: val }));

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-2xl" dir={isAr ? "rtl" : "ltr"}>
      {toast && (
        <div className={`fixed top-6 end-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.ok ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <h1 className="text-2xl font-black text-white mb-8">{isAr ? "إعدادات المتجر" : "Store settings"}</h1>

      <div className="space-y-6">
        {/* Section: Store info */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-semibold text-white mb-4">{isAr ? "معلومات المتجر" : "Store information"}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "الاسم بالعربية" : "Name (Arabic)"}</label>
              <input value={form.name_ar} onChange={(e) => f("name_ar", e.target.value)} dir="rtl" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "الاسم بالإنجليزية" : "Name (English)"}</label>
              <input value={form.name} onChange={(e) => f("name", e.target.value)} dir="ltr" required className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "وصف المتجر" : "Store description"}</label>
            <textarea value={form.description_ar} onChange={(e) => f("description_ar", e.target.value)} dir="rtl" rows={2} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder={isAr ? "وصف قصير لمتجرك..." : "Short description..."} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "رقم الهاتف" : "Phone"}</label>
              <input value={form.phone} onChange={(e) => f("phone", e.target.value)} dir="ltr" type="tel" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="+966 5x xxx xxxx" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "البريد الإلكتروني" : "Email"}</label>
              <input value={form.email} onChange={(e) => f("email", e.target.value)} dir="ltr" type="email" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="store@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "رابط الشعار" : "Logo URL"}</label>
            <input value={form.logo_url} onChange={(e) => f("logo_url", e.target.value)} dir="ltr" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://..." />
          </div>
        </section>

        {/* Section: Color */}
        <section className="glass rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">{isAr ? "لون المتجر" : "Store color"}</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => f("primary_color", c)} className={`w-9 h-9 rounded-xl transition-transform hover:scale-110 ${form.primary_color === c ? "ring-2 ring-white ring-offset-1 ring-offset-transparent scale-110" : ""}`} style={{ backgroundColor: c }} />
            ))}
            <label className="w-9 h-9 rounded-xl border border-white/20 flex items-center justify-center cursor-pointer hover:border-white/40 transition-colors overflow-hidden relative">
              <input type="color" value={form.primary_color} onChange={(e) => f("primary_color", e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              <span className="text-xs text-slate-400 pointer-events-none">+</span>
            </label>
            <div className="ms-2 w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: form.primary_color }} />
          </div>
        </section>

        {/* Section: AI */}
        <section className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">{isAr ? "مساعد الذكاء الاصطناعي" : "AI Assistant"}</h2>
            </div>
            <button type="button" onClick={() => f("ai_enabled", !form.ai_enabled)} className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.ai_enabled ? "bg-indigo-500" : "bg-white/10"}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.ai_enabled ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>

          {form.ai_enabled && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "شخصية المساعد" : "Assistant personality"}</label>
              <textarea
                value={form.ai_personality}
                onChange={(e) => f("ai_personality", e.target.value)}
                dir="rtl"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                placeholder={isAr ? "مساعد متجر ودود ومحترف يساعد العملاء في إيجاد ما يحتاجونه..." : "A friendly and professional store assistant..."}
              />
              <p className="text-xs text-slate-500 mt-1.5">{isAr ? "هذا النص يحدد كيف يتحدث المساعد مع عملائك" : "This text defines how the assistant speaks to your customers"}</p>
            </div>
          )}
        </section>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 rounded-xl gradient-brand text-white font-semibold glow-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isAr ? "حفظ الإعدادات" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/settings/page.tsx"

mkdir -p "app/[locale]/admin/ai"
cat > "app/[locale]/admin/ai/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { Bot, Send, Loader2, RefreshCw, CheckCircle } from "lucide-react";

interface ChatMsg { role: "user" | "assistant"; content: string }

export default function AdminAIPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [storeId, setStoreId] = useState<string | null>(null);
  const [personality, setPersonality] = useState("");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadStore(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadStore() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase
      .from("stores")
      .select("id, ai_personality, ai_enabled")
      .eq("owner_id", user.id)
      .single();
    if (store) {
      setStoreId(store.id);
      setPersonality(store.ai_personality ?? "");
      setAiEnabled(store.ai_enabled);
    }
    setLoading(false);
  }

  async function savePersonality() {
    if (!storeId) return;
    setSaving(true);
    await supabase.from("stores").update({ ai_personality: personality, ai_enabled: aiEnabled }).eq("id", storeId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function sendMessage() {
    if (!input.trim() || !storeId || chatLoading) return;
    const msg = input.trim();
    setInput("");
    const userMsg: ChatMsg = { role: "user", content: msg };
    setMessages((p) => [...p, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, storeId, history: messages }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", content: data.reply ?? "..." }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: isAr ? "حدث خطأ. تحقق من إعداد ANTHROPIC_API_KEY." : "Error. Check your ANTHROPIC_API_KEY." }]);
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Bot className="w-7 h-7 text-indigo-400" />
          {isAr ? "مساعد الذكاء الاصطناعي" : "AI Assistant"}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAr ? "اختبر مساعد متجرك وخصّص شخصيته" : "Test and customize your store assistant"}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Personality editor ── */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">{isAr ? "شخصية المساعد" : "Assistant personality"}</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-slate-400">{isAr ? "مفعّل" : "Enabled"}</span>
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${aiEnabled ? "bg-indigo-500" : "bg-white/10"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${aiEnabled ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </label>
          </div>

          <textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            rows={8}
            dir="rtl"
            placeholder={isAr
              ? "مثال: أنا مساعد متجر ودود ومحترف. أساعد العملاء في إيجاد المنتجات المناسبة وأجيب على أسئلتهم بشكل واضح..."
              : "Example: I am a friendly and professional store assistant. I help customers find the right products..."}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
          />

          <div className="bg-white/3 rounded-xl p-3 text-xs text-slate-400 leading-relaxed">
            💡 {isAr
              ? "المساعد سيعرف تلقائياً أسماء المنتجات وأسعارها ومخزونها. أضف هنا أسلوب التحدث والتخصص."
              : "The assistant automatically knows your product names, prices, and stock. Add speaking style and specialization here."}
          </div>

          <button
            onClick={savePersonality}
            disabled={saving}
            className="w-full py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
            {saved ? (isAr ? "تم الحفظ!" : "Saved!") : (isAr ? "حفظ الشخصية" : "Save personality")}
          </button>
        </div>

        {/* ── Live chat test ── */}
        <div className="glass rounded-2xl flex flex-col overflow-hidden" style={{ height: "480px" }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 gradient-brand rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">{isAr ? "اختبر المساعد" : "Test the assistant"}</span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            </div>
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors"
              title={isAr ? "مسح المحادثة" : "Clear chat"}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                <Bot className="w-10 h-10 text-slate-700" />
                <p className="text-slate-500 text-sm">{isAr ? "اكتب رسالة لاختبار المساعد" : "Send a message to test the assistant"}</p>
                <div className="flex flex-col gap-1.5 mt-2">
                  {[
                    isAr ? "ما هي المنتجات المتاحة؟" : "What products do you have?",
                    isAr ? "ما هو أرخص منتج عندكم؟" : "What's your cheapest product?",
                    isAr ? "هل لديكم عروض؟" : "Do you have any offers?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-xs px-3 py-1.5 rounded-lg glass text-slate-400 hover:text-white transition-colors text-start"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] text-xs px-3 py-2.5 rounded-2xl leading-relaxed ${
                  m.role === "user"
                    ? "gradient-brand text-white rounded-se-sm"
                    : "glass text-slate-200 rounded-ss-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="glass text-slate-400 text-xs px-3 py-2.5 rounded-2xl rounded-ss-sm flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {isAr ? "يكتب..." : "Typing..."}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || chatLoading || !storeId}
              className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/ai/page.tsx"

mkdir -p "app/store/[subdomain]"
cat > "app/store/[subdomain]/layout.tsx" << 'STOREHUB_MARKER'
import { createClient } from "@/supabase/server";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
};

export default async function StoreLayout({ children, params }: Props) {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, primary_color, is_active")
    .eq("subdomain", subdomain)
    .single();

  if (!store || !store.is_active) notFound();

  return (
    <div
      className="store-theme min-h-screen"
      style={{ "--store-primary": store.primary_color } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/store/[subdomain]/layout.tsx"

mkdir -p "app/store/[subdomain]"
cat > "app/store/[subdomain]/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/supabase/client";
import {
  ShoppingCart, X, Plus, Minus, Bot, Send, MessageCircle,
  Loader2, Store, Search, ChevronLeft,
} from "lucide-react";
import { formatCurrency } from "@/utils";
import type { Database } from "@/supabase/types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CartItem { product: Product; quantity: number }
interface ChatMsg { role: "user" | "assistant"; content: string }

const CART_KEY = (sub: string) => `storehub_cart_${sub}`;

export default function StorePage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const supabase = createClient();

  const [store, setStore] = useState<StoreRow | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // ── Load store data ────────────────────────────────────
  useEffect(() => {
    if (!subdomain) return;
    loadStore();
    // Restore cart from localStorage
    try {
      const saved = localStorage.getItem(CART_KEY(subdomain));
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, [subdomain]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (!subdomain) return;
    localStorage.setItem(CART_KEY(subdomain), JSON.stringify(cart));
  }, [cart, subdomain]);

  async function loadStore() {
    const { data } = await supabase
      .from("stores")
      .select("*, products(*), categories(*)")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single();

    if (!data) { setLoading(false); return; }

    setStore(data);
    // Sort categories and products
    const cats = (data.categories as Category[]).sort((a, b) => a.sort_order - b.sort_order);
    const prods = (data.products as Product[]).filter(p => p.is_active);
    setCategories(cats);
    setProducts(prods);
    setLoading(false);

    // Set page title and favicon color
    document.title = data.name_ar ?? data.name;
  }

  // ── Cart helpers ───────────────────────────────────────
  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => {
      const updated = prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i);
      return updated.filter((i) => i.quantity > 0);
    });
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  // ── Filtered products ───────────────────────────────────
  const filtered = products.filter((p) => {
    const inCategory = activeCategory === "all" || p.category_id === activeCategory;
    const inSearch = !search || [p.name, p.name_ar].some(n => n?.toLowerCase().includes(search.toLowerCase()));
    return inCategory && inSearch;
  });

  // ── AI chat ─────────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim() || !store || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const userMsg: ChatMsg = { role: "user", content: msg };
    setChatMessages((p) => [...p, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, storeId: store.id, history: chatMessages }),
      });
      const data = await res.json();
      setChatMessages((p) => [...p, { role: "assistant", content: data.reply ?? "عذراً، حدث خطأ." }]);
    } catch {
      setChatMessages((p) => [...p, { role: "assistant", content: "عذراً، حدث خطأ. حاول مجدداً." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const primaryColor = store?.primary_color ?? "#4F46E5";
  const isAr = true; // Store is Arabic-first

  // ── Loading ─────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: "transparent" }} />
    </div>
  );

  if (!store) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Store className="w-12 h-12 text-slate-400" />
      <p className="text-slate-500">المتجر غير موجود</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo + name */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (store.name_ar?.[0] ?? store.name[0])}
            </div>
            <span className="font-bold text-slate-800 text-sm">{store.name_ar ?? store.name}</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-sm">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm"
            />
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">السلة</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -start-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        <div className="border-t border-slate-100 overflow-x-auto">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 py-2 min-w-max">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeCategory === "all" ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
              style={activeCategory === "all" ? { backgroundColor: primaryColor } : undefined}
            >
              الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeCategory === cat.id ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
                style={activeCategory === cat.id ? { backgroundColor: primaryColor } : undefined}
              >
                {cat.name_ar ?? cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── PRODUCTS ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">{search ? "لا توجد نتائج" : "لا توجد منتجات في هذا التصنيف"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Product image */}
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.images[0]} alt={product.name_ar ?? product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-slate-200">🛍️</div>
                    )}
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="absolute top-2 start-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        خصم
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">نفذ المخزون</span>
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2 leading-snug">
                      {product.name_ar ?? product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-black" style={{ color: primaryColor }}>
                        {formatCurrency(product.price, "SAR", "ar-SA")}
                      </span>
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.compare_price, "SAR", "ar-SA")}
                        </span>
                      )}
                    </div>

                    {product.stock > 0 ? (
                      inCart ? (
                        <div className="flex items-center justify-between rounded-xl overflow-hidden border" style={{ borderColor: primaryColor }}>
                          <button onClick={() => updateQty(product.id, -1)} className="p-2 hover:bg-slate-50 transition-colors">
                            <Minus className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                          </button>
                          <span className="text-sm font-bold" style={{ color: primaryColor }}>{inCart.quantity}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="p-2 hover:bg-slate-50 transition-colors">
                            <Plus className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                          style={{ backgroundColor: primaryColor }}
                        >
                          أضف للسلة
                        </button>
                      )
                    ) : (
                      <button disabled className="w-full py-2 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">
                        نفذ المخزون
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative z-10 bg-white w-full max-w-md ms-auto flex flex-col shadow-2xl">
            {/* Cart header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-bold text-slate-800">السلة ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">سلتك فارغة</p>
                </div>
              ) : cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                    {item.product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.product.name_ar ?? item.product.name}</p>
                    <p className="text-sm font-bold" style={{ color: primaryColor }}>{formatCurrency(item.product.price, "SAR", "ar-SA")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                      <Minus className="w-3 h-3 text-slate-600" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                      <Plus className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t space-y-3">
                <div className="flex items-center justify-between text-base font-bold text-slate-800">
                  <span>الإجمالي</span>
                  <span style={{ color: primaryColor }}>{formatCurrency(cartTotal, "SAR", "ar-SA")}</span>
                </div>
                <Link
                  href={`/checkout`}
                  onClick={() => setCartOpen(false)}
                  className="block w-full py-3.5 rounded-xl text-white text-center font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  إتمام الشراء ←
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI CHAT ── */}
      {store.ai_enabled && (
        <div className="fixed bottom-5 start-5 z-40">
          {chatOpen ? (
            <div className="bg-white rounded-2xl shadow-2xl w-80 flex flex-col overflow-hidden" style={{ height: "420px" }}>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <span className="text-sm font-semibold">مساعد المتجر</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                </div>
                <button onClick={() => setChatOpen(false)} className="hover:opacity-70"><X className="w-4 h-4" /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    مرحباً! كيف يمكنني مساعدتك؟
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl leading-relaxed ${m.role === "user" ? "bg-slate-100 text-slate-700" : "text-white"}`} style={m.role === "assistant" ? { backgroundColor: primaryColor } : undefined}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-end">
                    <div className="text-white text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: primaryColor }}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="اسألني أي شيء..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-100 outline-none text-slate-700 placeholder-slate-400"
                />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setChatOpen(true)} className="w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110" style={{ backgroundColor: primaryColor }}>
              <MessageCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/store/[subdomain]/page.tsx"

mkdir -p "app/store/[subdomain]/checkout"
cat > "app/store/[subdomain]/checkout/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/supabase/client";
import { CheckCircle, Loader2, ShoppingBag, ChevronRight } from "lucide-react";
import { formatCurrency, generateOrderNumber } from "@/utils";
import type { Database } from "@/supabase/types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type DeliveryMethod = Database["public"]["Tables"]["delivery_methods"]["Row"];
interface CartItem { product: { id: string; name: string; name_ar: string | null; price: number; images: string[] }; quantity: number }

const CART_KEY = (sub: string) => `storehub_cart_${sub}`;

export default function CheckoutPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const supabase = createClient();

  const [store, setStore] = useState<StoreRow | null>(null);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    city: "", address: "", notes: "",
  });

  useEffect(() => {
    if (!subdomain) return;
    loadCheckout();
    try {
      const saved = localStorage.getItem(CART_KEY(subdomain));
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, [subdomain]);

  async function loadCheckout() {
    const { data } = await supabase
      .from("stores")
      .select("*, delivery_methods(*)")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single();

    if (data) {
      setStore(data);
      const methods = (data.delivery_methods as DeliveryMethod[]).filter(d => d.is_active);
      setDeliveryMethods(methods);
      if (methods.length > 0) setSelectedDelivery(methods[0]);
    }
    setLoading(false);
  }

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    if (!store || !form.name || !form.email || cart.length === 0) return;
    setPlacing(true);

    const orderNum = generateOrderNumber();

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        store_id: store.id,
        order_number: orderNum,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || null,
        status: "pending",
        payment_status: "pending",
        payment_method: "cash_on_delivery",
        subtotal,
        shipping_fee: deliveryFee,
        discount: 0,
        total,
        notes: form.notes || null,
        shipping_address: { city: form.city, address: form.address },
      })
      .select()
      .single();

    if (error || !order) { setPlacing(false); return; }

    // Insert order items
    await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name_ar ?? item.product.name,
        product_image: item.product.images[0] ?? null,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      }))
    );

    // Track event
    await supabase.from("analytics_events").insert({
      store_id: store.id,
      event_type: "order_placed",
      value: total,
    });

    // Clear cart
    localStorage.removeItem(CART_KEY(subdomain));
    setOrderNumber(orderNum);
    setDone(true);
    setPlacing(false);
  }

  const primaryColor = store?.primary_color ?? "#4F46E5";
  const f = (field: keyof typeof form, val: string) => setForm((p) => ({ ...p, [field]: val }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: "transparent" }} />
    </div>
  );

  // ── SUCCESS STATE ──
  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-lg">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: primaryColor + "20" }}>
          <CheckCircle className="w-8 h-8" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">تم استلام طلبك! 🎉</h1>
        <p className="text-slate-500 mb-2">رقم الطلب</p>
        <p className="text-lg font-mono font-bold mb-6" style={{ color: primaryColor }}>{orderNumber}</p>
        <p className="text-slate-500 text-sm mb-8">سيتواصل معك فريقنا قريباً لتأكيد الطلب ومتابعة الشحن.</p>
        <a href={`/`} className="block w-full py-3.5 rounded-xl text-white font-bold" style={{ backgroundColor: primaryColor }}>
          متابعة التسوق
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </a>
          <h1 className="text-base font-bold text-slate-800">إتمام الشراء</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── FORM ── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Customer info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">معلومات الشحن</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">الاسم الكامل *</label>
                  <input
                    value={form.name}
                    onChange={(e) => f("name", e.target.value)}
                    required
                    placeholder="محمد العمري"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">البريد الإلكتروني *</label>
                    <input
                      value={form.email}
                      onChange={(e) => f("email", e.target.value)}
                      type="email"
                      required
                      dir="ltr"
                      placeholder="email@example.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">رقم الهاتف</label>
                    <input
                      value={form.phone}
                      onChange={(e) => f("phone", e.target.value)}
                      type="tel"
                      dir="ltr"
                      placeholder="+966 5x xxx xxxx"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">المدينة</label>
                    <input
                      value={form.city}
                      onChange={(e) => f("city", e.target.value)}
                      placeholder="الرياض"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">العنوان</label>
                    <input
                      value={form.address}
                      onChange={(e) => f("address", e.target.value)}
                      placeholder="الحي، الشارع، رقم المبنى"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">ملاحظات (اختياري)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => f("notes", e.target.value)}
                    rows={2}
                    placeholder="أي تعليمات خاصة للتوصيل..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Delivery method */}
            {deliveryMethods.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-slate-800 mb-4">طريقة التوصيل</h2>
                <div className="space-y-2">
                  {deliveryMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedDelivery?.id === method.id ? "border-current bg-opacity-5" : "border-slate-200 hover:border-slate-300"}`}
                      style={selectedDelivery?.id === method.id ? { borderColor: primaryColor, backgroundColor: primaryColor + "08" } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          checked={selectedDelivery?.id === method.id}
                          onChange={() => setSelectedDelivery(method)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedDelivery?.id === method.id ? "border-current" : "border-slate-300"}`} style={selectedDelivery?.id === method.id ? { borderColor: primaryColor } : undefined}>
                          {selectedDelivery?.id === method.id && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{method.name_ar ?? method.name}</p>
                          {method.estimated_days && (
                            <p className="text-xs text-slate-400">{method.estimated_days} {method.estimated_days === 1 ? "يوم" : "أيام"}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: primaryColor }}>
                        {method.fee === 0 ? "مجاني" : formatCurrency(method.fee, "SAR", "ar-SA")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-20">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                ملخص الطلب ({cart.length})
              </h2>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                      {item.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{item.product.name_ar ?? item.product.name}</p>
                      <p className="text-xs text-slate-400">× {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-800 flex-shrink-0">
                      {formatCurrency(item.product.price * item.quantity, "SAR", "ar-SA")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 py-4 border-t border-slate-100">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal, "SAR", "ar-SA")}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>الشحن</span>
                    <span>{formatCurrency(deliveryFee, "SAR", "ar-SA")}</span>
                  </div>
                )}
                {deliveryFee === 0 && selectedDelivery && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>الشحن</span>
                    <span>مجاني 🎉</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-800 pt-2 border-t border-slate-100">
                  <span>الإجمالي</span>
                  <span style={{ color: primaryColor }}>{formatCurrency(total, "SAR", "ar-SA")}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || !form.name || !form.email || cart.length === 0}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : "تأكيد الطلب →"}
              </button>

              <p className="text-center text-xs text-slate-400 mt-3">الدفع عند الاستلام</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
STOREHUB_MARKER
echo "  ✅ app/store/[subdomain]/checkout/page.tsx"

mkdir -p "supabase"
cat > "supabase/types.ts" << 'STOREHUB_MARKER'
// ============================================================
// StoreHub — Supabase Database Types
// FIX: order_items.product_id is string | null (ON DELETE SET NULL)
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          subdomain: string;
          name: string;
          name_ar: string | null;
          description: string | null;
          description_ar: string | null;
          logo_url: string | null;
          banner_url: string | null;
          primary_color: string;
          owner_id: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          country: string;
          currency: string;
          is_active: boolean;
          ai_enabled: boolean;
          ai_personality: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["stores"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["stores"]["Insert"]
        >;
      };

      categories: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          name_ar: string | null;
          slug: string;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["categories"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["categories"]["Insert"]
        >;
      };

      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          name: string;
          name_ar: string | null;
          description: string | null;
          description_ar: string | null;
          price: number;
          compare_price: number | null;
          images: string[];
          sku: string | null;
          stock: number;
          is_active: boolean;
          weight: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["products"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["products"]["Insert"]
        >;
      };

      orders: {
        Row: {
          id: string;
          store_id: string;
          order_number: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          status:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          payment_status: "pending" | "paid" | "refunded";
          payment_method: string | null;
          subtotal: number;
          shipping_fee: number;
          discount: number;
          total: number;
          notes: string | null;
          shipping_address: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orders"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["orders"]["Insert"]
        >;
      };

      order_items: {
        Row: {
          id: string;
          order_id: string;
          // ✅ FIXED: was `string` — must be nullable because of ON DELETE SET NULL
          product_id: string | null;
          product_name: string;
          product_image: string | null;
          price: number;
          quantity: number;
          subtotal: number;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id">;
        Update: Partial<
          Database["public"]["Tables"]["order_items"]["Insert"]
        >;
      };

      delivery_methods: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          name_ar: string | null;
          description: string | null;
          fee: number;
          is_active: boolean;
          estimated_days: number | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["delivery_methods"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["delivery_methods"]["Insert"]
        >;
      };

      analytics_events: {
        Row: {
          id: string;
          store_id: string;
          event_type: string;
          product_id: string | null;
          order_id: string | null;
          value: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["analytics_events"]["Row"],
          "id" | "created_at"
        >;
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
STOREHUB_MARKER
echo "  ✅ supabase/types.ts"

mkdir -p "supabase"
cat > "supabase/client.ts" << 'STOREHUB_MARKER'
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
STOREHUB_MARKER
echo "  ✅ supabase/client.ts"

mkdir -p "supabase"
cat > "supabase/server.ts" << 'STOREHUB_MARKER'
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
STOREHUB_MARKER
echo "  ✅ supabase/server.ts"

echo ""
echo "✅ تم إنشاء جميع الملفات!"
echo "👉 الآن شغّل: pnpm dev"