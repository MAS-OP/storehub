#!/bin/bash
set -e
echo "🚀 إنشاء الملفات الناقصة..."

mkdir -p "app/[locale]/admin"
cat > "app/[locale]/admin/layout.tsx" << 'STOREHUB_MARKER'
import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Store, LayoutDashboard, Package, ShoppingBag,
  BarChart3, Calculator, Settings, Bot,
  ExternalLink, LogOut, Plug, Bell,
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

  // عدد الإشعارات غير المقروءة
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)
    .eq("is_read", false);

  const navItems = [
    { href: `/${locale}/admin`,              icon: LayoutDashboard, label: isAr ? "لوحة التحكم"      : "Dashboard" },
    { href: `/${locale}/admin/products`,     icon: Package,         label: isAr ? "المنتجات"          : "Products" },
    { href: `/${locale}/admin/orders`,       icon: ShoppingBag,     label: isAr ? "الطلبات"           : "Orders" },
    { href: `/${locale}/admin/analytics`,    icon: BarChart3,       label: isAr ? "التحليلات"         : "Analytics" },
    { href: `/${locale}/admin/accounting`,   icon: Calculator,      label: isAr ? "المحاسبة"          : "Accounting" },
    { href: `/${locale}/admin/integrations`, icon: Plug,            label: isAr ? "الموصلات"          : "Integrations" },
    { href: `/${locale}/admin/ai`,           icon: Bot,             label: isAr ? "المساعد الذكي"     : "AI Assistant" },
    { href: `/${locale}/admin/settings`,     icon: Settings,        label: isAr ? "الإعدادات"         : "Settings" },
    {
      href: `/${locale}/admin/notifications`,
      icon: Bell,
      label: isAr ? "الإشعارات" : "Notifications",
      badge: unreadCount ?? 0,
    },
  ];

  return (
    <div className="flex min-h-screen" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Sidebar ── */}
      <aside className="w-64 glass border-e border-white/5 flex flex-col fixed inset-y-0 start-0 z-30">
        {/* هوية المتجر */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
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

        {/* قائمة التنقل */}
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
                <span className="flex-1">{item.label}</span>
                {"badge" in item && (item.badge as number) > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
                    {item.badge as number}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* تذييل */}
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
          <form action="/api/auth/signout" method="POST">
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

      {/* ── المحتوى الرئيسي ── */}
      <main className="flex-1 ms-64 min-h-screen">{children}</main>
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

mkdir -p "app/[locale]/admin/ai"
cat > "app/[locale]/admin/ai/page.tsx" << 'STOREHUB_MARKER'
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
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/ai/page.tsx"

mkdir -p "app/[locale]/admin/integrations"
cat > "app/[locale]/admin/integrations/page.tsx" << 'STOREHUB_MARKER'
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import { CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Plug } from "lucide-react";

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
    (rows ?? []).forEach((r: any) => { map[r.type] = { is_active: r.is_active, config: r.config }; });
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
      store_id: storeId, type, name, config, is_active: active,
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
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/integrations/page.tsx"

mkdir -p "app/[locale]/admin/notifications"
cat > "app/[locale]/admin/notifications/page.tsx" << 'STOREHUB_MARKER'
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
    setNotifications((data as Notification[]) ?? []);
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
STOREHUB_MARKER
echo "  ✅ app/[locale]/admin/notifications/page.tsx"

mkdir -p "app/api/assistant"
cat > "app/api/assistant/route.ts" << 'STOREHUB_MARKER'
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/supabase/server";

const anthropic = new Anthropic();

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  try {
    const { message, storeId, history = [] }: { message: string; storeId: string; history: Message[] } =
      await request.json();

    if (!message || !storeId) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // جلب بيانات المتجر الكاملة
    const [storeRes, ordersRes, productsRes] = await Promise.all([
      supabase.from("stores").select("*").eq("id", storeId).single(),
      supabase.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }).limit(50),
      supabase.from("products").select("*").eq("store_id", storeId),
    ]);

    const store = storeRes.data;
    const orders = ordersRes.data ?? [];
    const products = productsRes.data ?? [];

    if (!store) return Response.json({ error: "Store not found" }, { status: 404 });

    // تحليل البيانات
    const totalRevenue = orders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total, 0);
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const todayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });
    const lowStockProducts = products.filter(p => p.stock < 5 && p.is_active);
    const outOfStockProducts = products.filter(p => p.stock === 0 && p.is_active);

    // أفضل المنتجات (بناءً على السعر × المخزون المُباع)
    const recentOrdersThisMonth = orders.filter(o => {
      const d = new Date(o.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyRevenue = recentOrdersThisMonth.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total, 0);

    const systemPrompt = `أنت مساعد ذكي خاص بصاحب متجر "${store.name_ar ?? store.name}".
دورك: محلل تجاري ومستشار ذكي يعرف كل شيء عن هذا المتجر ويساعد صاحبه على اتخاذ قرارات أفضل.

═══ بيانات المتجر الحالية ═══

📊 الملخص المالي:
- إجمالي الإيرادات: ${totalRevenue.toFixed(2)} ريال
- إيرادات هذا الشهر: ${monthlyRevenue.toFixed(2)} ريال
- طلبات اليوم: ${todayOrders.length} طلب (${todayOrders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total, 0).toFixed(2)} ريال)

📦 الطلبات:
- إجمالي الطلبات: ${orders.length}
- قيد الانتظار: ${pendingOrders} طلب
- تم التسليم: ${orders.filter(o => o.status === "delivered").length} طلب
- ملغي: ${orders.filter(o => o.status === "cancelled").length} طلب

🛍️ المنتجات:
- إجمالي المنتجات: ${products.length}
- نشط: ${products.filter(p => p.is_active).length}
- منخفض المخزون (أقل من 5): ${lowStockProducts.map(p => `${p.name_ar ?? p.name} (${p.stock})`).join(", ") || "لا يوجد"}
- نفذ المخزون: ${outOfStockProducts.map(p => p.name_ar ?? p.name).join(", ") || "لا يوجد"}

📋 آخر الطلبات:
${orders.slice(0, 5).map(o => `- #${o.order_number}: ${o.customer_name} — ${o.total} ريال (${o.status})`).join("\n")}

قواعد مهمة:
1. تحدث بالعربية دائماً بلهجة مهنية وودية
2. كن محدداً وعملياً في إجاباتك
3. إذا لاحظت مشاكل (كمخزون منخفض أو طلبات معلقة)، نبّه عليها
4. عند طلب تقرير، قدّمه بشكل منظم وواضح
5. اقترح دائماً خطوات عملية`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        ...history.slice(-8),
        { role: "user", content: message },
      ],
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";
    return Response.json({ reply });
  } catch (error) {
    console.error("Assistant error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
STOREHUB_MARKER
echo "  ✅ app/api/assistant/route.ts"

mkdir -p "app/api/notify"
cat > "app/api/notify/route.ts" << 'STOREHUB_MARKER'
import { createClient } from "@/supabase/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { storeId } = await request.json();
    if (!storeId) return Response.json({ error: "Missing storeId" }, { status: 400 });

    const supabase = await createClient();

    // جلب بيانات المتجر
    const { data: store } = await supabase
      .from("stores")
      .select("*, integrations(*)")
      .eq("id", storeId)
      .single();

    if (!store) return Response.json({ error: "Store not found" }, { status: 404 });

    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*").eq("store_id", storeId).eq("is_active", true),
      supabase.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }).limit(100),
    ]);

    const products = productsRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const notifications: Array<{ store_id: string; type: string; title: string; message: string; metadata?: object }> = [];

    // ── فحص المخزون المنخفض ──
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 5);
    const outOfStock = products.filter(p => p.stock === 0);

    if (outOfStock.length > 0) {
      notifications.push({
        store_id: storeId,
        type: "low_stock",
        title: `⚠️ ${outOfStock.length} منتج نفذ مخزونه`,
        message: outOfStock.map(p => p.name_ar ?? p.name).join("، "),
        metadata: { products: outOfStock.map(p => p.id) },
      });
    }

    if (lowStock.length > 0) {
      notifications.push({
        store_id: storeId,
        type: "low_stock",
        title: `📦 ${lowStock.length} منتج مخزونه منخفض`,
        message: lowStock.map(p => `${p.name_ar ?? p.name} (${p.stock} قطعة متبقية)`).join("، "),
        metadata: { products: lowStock.map(p => p.id) },
      });
    }

    // ── فحص الطلبات المعلقة ──
    const pendingOrders = orders.filter(o => o.status === "pending");
    const oldPending = pendingOrders.filter(o => {
      const created = new Date(o.created_at);
      const now = new Date();
      const hoursOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      return hoursOld > 2;
    });

    if (oldPending.length > 0) {
      notifications.push({
        store_id: storeId,
        type: "new_order",
        title: `🕐 ${oldPending.length} طلب ينتظر التأكيد منذ أكثر من ساعتين`,
        message: oldPending.map(o => `#${o.order_number} — ${o.customer_name}`).join("، "),
        metadata: { orders: oldPending.map(o => o.id) },
      });
    }

    // ── تقرير يومي ──
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
    const todayRevenue = todayOrders.filter(o => o.payment_status === "paid").reduce((s, o) => s + o.total, 0);

    if (todayOrders.length > 0) {
      notifications.push({
        store_id: storeId,
        type: "daily_report",
        title: `📊 ملخص اليوم`,
        message: `${todayOrders.length} طلب جديد — إيرادات اليوم: ${todayRevenue.toFixed(2)} ريال`,
        metadata: { orders_count: todayOrders.length, revenue: todayRevenue },
      });
    }

    // ── حفظ الإشعارات ──
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    // ── إرسال بريد إلكتروني إذا كان Resend مفعّلاً ──
    const emailIntegration = (store.integrations as Array<{ type: string; is_active: boolean; config: Record<string, string> }>)
      ?.find(i => i.type === "email_resend" && i.is_active);

    if (emailIntegration?.config?.api_key && store.email) {
      try {
        const resend = new Resend(emailIntegration.config.api_key);
        const storeName = store.name_ar ?? store.name;
        const fromEmail = emailIntegration.config.from_email ?? "noreply@storehub.sa";

        const emailBody = `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
            <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 20px;">تقرير متجرك — ${storeName}</h1>
              <p style="margin: 5px 0 0; opacity: 0.8; font-size: 14px;">${new Date().toLocaleDateString("ar-SA")}</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 0 0 12px 12px;">
              ${notifications.map(n => `
                <div style="padding: 12px; margin-bottom: 10px; border-right: 4px solid #4f46e5; background: #f0f0ff; border-radius: 8px;">
                  <strong style="color: #1e1b4b;">${n.title}</strong>
                  <p style="margin: 4px 0 0; color: #555; font-size: 14px;">${n.message}</p>
                </div>
              `).join("")}
              <div style="margin-top: 20px; text-align: center;">
                <a href="https://storehub.sa/ar/admin" style="background: #4f46e5; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  فتح لوحة التحكم
                </a>
              </div>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: fromEmail,
          to: store.email,
          subject: `📊 تقرير متجرك "${storeName}" — ${notifications.length} تنبيه`,
          html: emailBody,
        });
      } catch (emailError) {
        console.error("Email error:", emailError);
        // لا نوقف العملية إذا فشل البريد
      }
    }

    return Response.json({
      success: true,
      notifications_created: notifications.length,
      summary: {
        low_stock: outOfStock.length + lowStock.length,
        pending_orders: oldPending.length,
        today_orders: todayOrders.length,
        today_revenue: todayRevenue,
      },
    });
  } catch (error) {
    console.error("Notify error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
STOREHUB_MARKER
echo "  ✅ app/api/notify/route.ts"

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

echo ""
echo "✅ تم إنشاء 11 ملف!"
echo "👉 شغّل: pnpm dev"