"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { Bot, Send, Loader2, RefreshCw, Mail, CheckCircle } from "lucide-react";

interface ChatMsg { role: "user" | "assistant"; content: string }

const QUICK_QUESTIONS = [
  "كيف كانت مبيعات هذا الشهر؟",
  "ما هي المنتجات الأكثر مبيعاً؟",
  "كم عدد الطلبات المعلقة؟",
  "أرسل لي تقرير يومي على البريد",
  "ما هي المنتجات التي يجب إعادة تخزينها؟",
  "قارن أداء هذا الشهر بالشهر الماضي",
];

export default function OwnerAssistantPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [storeId, setStoreId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase.from("stores").select("id, name_ar, name").eq("owner_id", user.id).single();
    if (store) {
      setStoreId(store.id);
      // رسالة ترحيب تلقائية
      setMessages([{
        role: "assistant",
        content: `مرحباً! أنا مساعدك الذكي لمتجر "${store.name_ar ?? store.name}" 🎯\n\nيمكنني مساعدتك في:\n• تحليل المبيعات والإيرادات\n• متابعة الطلبات والمخزون\n• إرسال تقارير على بريدك\n• اقتراح تحسينات بناءً على بيانات متجرك\n\nاسألني أي شيء عن متجرك!`,
      }]);
    }
    setPageLoading(false);
  }

  async function send(msg?: string) {
    const message = msg ?? input.trim();
    if (!message || !storeId || loading) return;
    setInput("");
    const userMsg: ChatMsg = { role: "user", content: message };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, storeId, history: messages.slice(-6) }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply ?? "عذراً، حدث خطأ. تأكد من إضافة ANTHROPIC_API_KEY في .env.local",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "حدث خطأ في الاتصال. تحقق من إعدادات المشروع.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function checkAndNotify() {
    if (!storeId) return;
    setNotifying(true);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      setNotified(true);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ تم فحص المتجر وإنشاء الإشعارات!\n\n📊 الملخص:\n• مخزون منخفض: ${data.summary?.low_stock ?? 0} منتج\n• طلبات معلقة: ${data.summary?.pending_orders ?? 0} طلب\n• طلبات اليوم: ${data.summary?.today_orders ?? 0} طلب\n• إيرادات اليوم: ${data.summary?.today_revenue?.toFixed(2) ?? 0} ريال\n\nاذهب لصفحة الإشعارات لرؤية التفاصيل كاملة.`,
      }]);
      setTimeout(() => setNotified(false), 3000);
    } finally {
      setNotifying(false);
    }
  }

  if (pageLoading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col h-screen p-6 md:p-8 max-w-4xl" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bot className="w-7 h-7 text-indigo-400" />
            {isAr ? "المساعد الذكي لمتجرك" : "Store AI Assistant"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr ? "محلل تجاري يعرف كل شيء عن متجرك" : "Business analyst that knows everything about your store"}
          </p>
        </div>
        <button
          onClick={checkAndNotify}
          disabled={notifying}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-slate-300 text-sm font-medium hover:text-white transition-colors disabled:opacity-50"
        >
          {notifying ? <Loader2 className="w-4 h-4 animate-spin" /> : notified ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <RefreshCw className="w-4 h-4" />}
          {isAr ? "فحص المتجر وإرسال تقرير" : "Check store & report"}
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 glass rounded-2xl flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "gradient-brand text-white rounded-se-sm"
                  : "glass text-slate-200 rounded-ss-sm"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass text-slate-400 text-xs px-4 py-3 rounded-2xl rounded-ss-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {isAr ? "يحلل بيانات متجرك..." : "Analyzing your store..."}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        {messages.length <= 1 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-xs px-3 py-1.5 rounded-xl glass text-slate-400 hover:text-white hover:bg-white/5 transition-all text-right"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-white/5 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={isAr ? "اسأل عن متجرك..." : "Ask about your store..."}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
