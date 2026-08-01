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
