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
