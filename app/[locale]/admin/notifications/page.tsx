"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { Bell, Package, ShoppingBag, TrendingUp, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { formatDate } from "@/utils";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  low_stock:    { icon: Package,     color: "text-amber-400 bg-amber-500/10" },
  new_order:    { icon: ShoppingBag, color: "text-indigo-400 bg-indigo-500/10" },
  daily_report: { icon: TrendingUp,  color: "text-emerald-400 bg-emerald-500/10" },
  payment:      { icon: TrendingUp,  color: "text-emerald-400 bg-emerald-500/10" },
};

export default function NotificationsPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [storeId, setStoreId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
    if (!store) return;
    setStoreId(store.id);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data as unknown as Notification[]) ?? []);
    setLoading(false);
  }

  async function markAllRead() {
    if (!storeId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("store_id", storeId).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function checkNow() {
    if (!storeId) return;
    setChecking(true);
    try {
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });
      await load();
    } finally {
      setChecking(false);
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-400" />
            {isAr ? "الإشعارات" : "Notifications"}
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isAr ? "تنبيهات متجرك — مخزون، طلبات، وتقارير" : "Store alerts — stock, orders, and reports"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass text-slate-300 text-sm hover:text-white transition-colors">
              <CheckCheck className="w-4 h-4" />
              {isAr ? "قراءة الكل" : "Mark all read"}
            </button>
          )}
          <button onClick={checkNow} disabled={checking} className="flex items-center gap-1.5 px-3 py-2 rounded-xl gradient-brand text-white text-sm font-medium disabled:opacity-50">
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isAr ? "فحص الآن" : "Check now"}
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">{isAr ? "لا توجد إشعارات بعد" : "No notifications yet"}</p>
          <p className="text-slate-500 text-xs mt-2">{isAr ? 'اضغط "فحص الآن" لفحص المتجر' : 'Press "Check now" to scan your store'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const typeInfo = TYPE_ICONS[n.type] ?? { icon: Bell, color: "text-slate-400 bg-white/5" };
            const Icon = typeInfo.icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`glass rounded-2xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/5 ${!n.is_read ? "border border-indigo-500/20" : "opacity-60"}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.is_read ? "text-slate-300" : "text-white"}`}>{n.title}</p>
                    {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-slate-600 mt-1.5">{formatDate(n.created_at, isAr ? "ar-SA" : "en-US")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}