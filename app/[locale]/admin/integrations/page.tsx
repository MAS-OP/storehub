"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Plug } from "lucide-react";
import type { Json } from "@/supabase/types";

// ── تعريف جميع الموصلات ───────────────────────────────────
const CATEGORIES = [
  {
    key: "payment",
    label: "💳 بوابات الدفع",
    labelEn: "Payment Gateways",
    items: [
      {
        type: "moyasar", name: "Moyasar", nameAr: "موسر",
        desc: "قبول مدى، فيزا، ماستركارد و Apple Pay", color: "#1B4FBB",
        fields: [
          { key: "publishable_key", label: "Publishable Key", placeholder: "pk_test_..." },
          { key: "secret_key", label: "Secret Key", placeholder: "sk_test_...", secret: true },
        ],
      },
      {
        type: "tap", name: "Tap Payments", nameAr: "تاب للمدفوعات",
        desc: "بوابة دفع متكاملة للسوق الخليجي", color: "#B11226",
        fields: [
          { key: "secret_key", label: "Secret Key", placeholder: "sk_test_...", secret: true },
        ],
      },
      {
        type: "hyperpay", name: "HyperPay", nameAr: "هايبر باي",
        desc: "حلول دفع شاملة للمملكة العربية السعودية", color: "#00AEEF",
        fields: [
          { key: "entity_id", label: "Entity ID", placeholder: "..." },
          { key: "access_token", label: "Access Token", placeholder: "OGE4...", secret: true },
        ],
      },
    ],
  },
  {
    key: "delivery",
    label: "🚚 خدمات التوصيل",
    labelEn: "Delivery Services",
    items: [
      {
        type: "aramex", name: "Aramex", nameAr: "أرامكس",
        desc: "توصيل سريع داخل وخارج المملكة", color: "#E31837",
        fields: [
          { key: "username", label: "اسم المستخدم", placeholder: "username" },
          { key: "password", label: "كلمة المرور", placeholder: "••••••", secret: true },
          { key: "account_number", label: "رقم الحساب", placeholder: "12345" },
        ],
      },
      {
        type: "smsa", name: "SMSA Express", nameAr: "سمسا",
        desc: "الشركة السعودية للشحن والتوصيل", color: "#00A651",
        fields: [
          { key: "api_key", label: "API Key", placeholder: "smsa_...", secret: true },
          { key: "sender_id", label: "Sender ID", placeholder: "SMSA" },
        ],
      },
      {
        type: "jnt", name: "J&T Express", nameAr: "J&T إكسبريس",
        desc: "توصيل سريع بأسعار تنافسية", color: "#CC0000",
        fields: [
          { key: "merchant_code", label: "Merchant Code", placeholder: "JT123" },
          { key: "api_key", label: "API Key", placeholder: "...", secret: true },
        ],
      },
    ],
  },
  {
    key: "communication",
    label: "📱 التواصل",
    labelEn: "Communication",
    items: [
      {
        type: "whatsapp", name: "WhatsApp Business", nameAr: "واتساب للأعمال",
        desc: "إرسال تأكيدات الطلبات والتحديثات عبر واتساب", color: "#25D366",
        fields: [
          { key: "phone_number_id", label: "Phone Number ID", placeholder: "123456789" },
          { key: "access_token", label: "Access Token", placeholder: "EAABSc...", secret: true },
          { key: "verify_token", label: "Verify Token", placeholder: "my_token" },
        ],
      },
      {
        type: "unifonic", name: "Unifonic SMS", nameAr: "يونيفونيك",
        desc: "إرسال رسائل SMS لتأكيد الطلبات والشحن", color: "#FF6B35",
        fields: [
          { key: "app_id", label: "App ID", placeholder: "unifonic_app_...", secret: true },
          { key: "sender_id", label: "Sender ID", placeholder: "StoreHub" },
        ],
      },
      {
        type: "email_resend", name: "Resend Email", nameAr: "إشعارات البريد",
        desc: "إشعارات بريد إلكتروني للمالك والعملاء", color: "#000000",
        fields: [
          { key: "api_key", label: "Resend API Key", placeholder: "re_...", secret: true },
          { key: "from_email", label: "بريد المرسل", placeholder: "noreply@yourstore.com" },
        ],
      },
    ],
  },
  {
    key: "social",
    label: "📣 وسائل التواصل الاجتماعي",
    labelEn: "Social Media",
    items: [
      {
        type: "instagram", name: "Instagram & Facebook", nameAr: "إنستغرام وفيسبوك",
        desc: "ربط المنتجات بحسابك وعرضها للمتابعين", color: "#E1306C",
        fields: [
          { key: "page_id", label: "Page ID", placeholder: "123456" },
          { key: "access_token", label: "Access Token", placeholder: "EAABSc...", secret: true },
          { key: "catalog_id", label: "Catalog ID", placeholder: "789..." },
        ],
      },
      {
        type: "snapchat", name: "Snapchat", nameAr: "سناب شات",
        desc: "إعلانات سناب ومتابعة تحويلات متجرك", color: "#FFFC00",
        fields: [
          { key: "pixel_id", label: "Snap Pixel ID", placeholder: "snap_pxl_..." },
          { key: "access_token", label: "Access Token", placeholder: "...", secret: true },
        ],
      },
      {
        type: "tiktok", name: "TikTok Shop", nameAr: "تيك توك",
        desc: "البيع المباشر وتتبع التحويلات عبر تيك توك", color: "#010101",
        fields: [
          { key: "pixel_id", label: "TikTok Pixel ID", placeholder: "CSABC..." },
          { key: "access_token", label: "Access Token", placeholder: "...", secret: true },
        ],
      },
    ],
  },
];

type Integration = { is_active: boolean; config: Record<string, string> };

export default function IntegrationsPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [storeId, setStoreId] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, Integration>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
    if (!store) return;
    setStoreId(store.id);
    const { data: rows } = await supabase.from("integrations").select("*").eq("store_id", store.id);
    const map: Record<string, Integration> = {};
    (rows ?? []).forEach((r) => {
      map[r.type] = { is_active: r.is_active, config: r.config as unknown as Record<string, string> };
    });
    setData(map);
    setLoading(false);
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function save(type: string, name: string, config: Record<string, string>, active: boolean) {
    if (!storeId) return;
    setSaving(type);
    const { error } = await supabase.from("integrations").upsert({
      store_id: storeId,
      type,
      name,
      config: config as unknown as Json,
      is_active: active,
    }, { onConflict: "store_id,type" });
    setSaving(null);
    if (error) showToast(isAr ? "حدث خطأ أثناء الحفظ" : "Error saving", false);
    else {
      showToast(isAr ? "تم الحفظ بنجاح" : "Saved successfully", true);
      setData(prev => ({ ...prev, [type]: { is_active: active, config } }));
    }
  }

  async function toggleActive(type: string, name: string) {
    const current = data[type] ?? { is_active: false, config: {} };
    await save(type, name, current.config, !current.is_active);
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-4xl" dir={isAr ? "rtl" : "ltr"}>
      {toast && (
        <div className={`fixed top-6 end-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.ok ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Plug className="w-7 h-7 text-indigo-400" />
          {isAr ? "الموصلات والتكاملات" : "Integrations"}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAr ? "ربط متجرك بخدمات الدفع والتوصيل والتواصل الاجتماعي" : "Connect your store to payment, delivery, and social services"}
        </p>
      </div>

      <div className="space-y-8">
        {CATEGORIES.map((cat) => (
          <div key={cat.key}>
            <h2 className="text-base font-semibold text-white mb-4">{isAr ? cat.label : cat.labelEn}</h2>
            <div className="space-y-3">
              {cat.items.map((item) => {
                const current = data[item.type] ?? { is_active: false, config: {} };
                const isOpen = expanded === item.type;

                return (
                  <div key={item.type} className={`glass rounded-2xl overflow-hidden transition-all ${current.is_active ? "border border-emerald-500/30" : ""}`}>
                    {/* Header */}
                    <div className="flex items-center gap-4 p-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: item.color + "22", border: `1px solid ${item.color}44` }}>
                        {cat.key === "payment" ? "💳" : cat.key === "delivery" ? "🚚" : cat.key === "communication" ? "📱" : "📣"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{isAr ? item.nameAr : item.name}</span>
                          {current.is_active && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              {isAr ? "مفعّل" : "Active"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{item.desc}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleActive(item.type, item.nameAr)}
                          disabled={saving === item.type}
                          className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${current.is_active ? "bg-emerald-500" : "bg-white/10"}`}
                        >
                          {saving === item.type ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white mx-auto" />
                          ) : (
                            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${current.is_active ? "translate-x-4" : "translate-x-0"}`} />
                          )}
                        </button>
                        <button onClick={() => setExpanded(isOpen ? null : item.type)} className="p-1 text-slate-400 hover:text-white">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Config form */}
                    {isOpen && (
                      <IntegrationForm
                        item={item}
                        current={current}
                        saving={saving === item.type}
                        isAr={isAr}
                        onSave={(config) => save(item.type, item.nameAr, config, current.is_active)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── مكوّن نموذج الإعداد ────────────────────────────────────
function IntegrationForm({ item, current, saving, isAr, onSave }: {
  item: (typeof CATEGORIES)[0]["items"][0];
  current: Integration;
  saving: boolean;
  isAr: boolean;
  onSave: (config: Record<string, string>) => void;
}) {
  const [config, setConfig] = useState<Record<string, string>>(current.config);

  return (
    <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-3">
      {item.fields.map((field) => (
        <div key={field.key}>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">{field.label}</label>
          <input
            type={field.secret ? "password" : "text"}
            value={config[field.key] ?? ""}
            onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            dir="ltr"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
        </div>
      ))}
      <button
        onClick={() => onSave(config)}
        disabled={saving}
        className="w-full py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {isAr ? "حفظ الإعدادات" : "Save settings"}
      </button>
    </div>
  );
}