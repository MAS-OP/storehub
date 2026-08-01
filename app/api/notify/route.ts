import { createClient } from "@/supabase/server";
import { Resend } from "resend";
import type { Database, Json } from "@/supabase/types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

interface IntegrationRow {
  type: string;
  is_active: boolean;
  config: Record<string, string>;
}

export async function POST(request: Request) {
  try {
    const { storeId } = await request.json();
    if (!storeId) return Response.json({ error: "Missing storeId" }, { status: 400 });

    const supabase = await createClient();

    // جلب بيانات المتجر
    const { data } = await supabase
      .from("stores")
      .select("*, integrations(*)")
      .eq("id", storeId)
      .single();

    if (!data) return Response.json({ error: "Store not found" }, { status: 404 });

    const store = data as unknown as StoreRow & { integrations: IntegrationRow[] };

    const [productsRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*").eq("store_id", storeId).eq("is_active", true),
      supabase.from("orders").select("*").eq("store_id", storeId).order("created_at", { ascending: false }).limit(100),
    ]);

    const products = productsRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const notifications: Array<{ store_id: string; type: string; title: string; message: string; metadata: Json }> = [];

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
    const emailIntegration = store.integrations?.find(i => i.type === "email_resend" && i.is_active);

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