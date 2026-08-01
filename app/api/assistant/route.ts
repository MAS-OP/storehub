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
