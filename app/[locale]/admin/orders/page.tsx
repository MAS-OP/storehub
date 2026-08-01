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
