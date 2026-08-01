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
