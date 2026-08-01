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
