"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/supabase/client";
import { CheckCircle, Loader2, ShoppingBag, ChevronRight } from "lucide-react";
import { formatCurrency, generateOrderNumber } from "@/utils";
import type { Database } from "@/supabase/types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type DeliveryMethod = Database["public"]["Tables"]["delivery_methods"]["Row"];
interface CartItem { product: { id: string; name: string; name_ar: string | null; price: number; images: string[] }; quantity: number }

const CART_KEY = (sub: string) => `storehub_cart_${sub}`;

export default function CheckoutPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const supabase = createClient();

  const [store, setStore] = useState<StoreRow | null>(null);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    city: "", address: "", notes: "",
  });

  useEffect(() => {
    if (!subdomain) return;
    loadCheckout();
    try {
      const saved = localStorage.getItem(CART_KEY(subdomain));
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, [subdomain]);

  async function loadCheckout() {
    const { data } = await supabase
      .from("stores")
      .select("*, delivery_methods(*)")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single();

    if (data) {
      const storeData = data as unknown as StoreRow & { delivery_methods: DeliveryMethod[] };
      setStore(storeData);
      const methods = storeData.delivery_methods.filter((d) => d.is_active);
      setDeliveryMethods(methods);
      if (methods.length > 0) setSelectedDelivery(methods[0]);
    }
    setLoading(false);
  }

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryFee = selectedDelivery?.fee ?? 0;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    if (!store || !form.name || !form.email || cart.length === 0) return;
    setPlacing(true);

    const orderNum = generateOrderNumber();

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        store_id: store.id,
        order_number: orderNum,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone || null,
        status: "pending",
        payment_status: "pending",
        payment_method: "cash_on_delivery",
        subtotal,
        shipping_fee: deliveryFee,
        discount: 0,
        total,
        notes: form.notes || null,
        shipping_address: { city: form.city, address: form.address },
      })
      .select()
      .single();

    if (error || !order) { setPlacing(false); return; }

    // Insert order items
    await supabase.from("order_items").insert(
      cart.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name_ar ?? item.product.name,
        product_image: item.product.images[0] ?? null,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      }))
    );

    // Track event
    await supabase.from("analytics_events").insert({
      store_id: store.id,
      event_type: "order_placed",
      value: total,
    });

    // Clear cart
    localStorage.removeItem(CART_KEY(subdomain));
    setOrderNumber(orderNum);
    setDone(true);
    setPlacing(false);
  }

  const primaryColor = store?.primary_color ?? "#4F46E5";
  const f = (field: keyof typeof form, val: string) => setForm((p) => ({ ...p, [field]: val }));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: "transparent" }} />
    </div>
  );

  // ── SUCCESS STATE ──
  if (done) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-lg">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: primaryColor + "20" }}>
          <CheckCircle className="w-8 h-8" style={{ color: primaryColor }} />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">تم استلام طلبك! 🎉</h1>
        <p className="text-slate-500 mb-2">رقم الطلب</p>
        <p className="text-lg font-mono font-bold mb-6" style={{ color: primaryColor }}>{orderNumber}</p>
        <p className="text-slate-500 text-sm mb-8">سيتواصل معك فريقنا قريباً لتأكيد الطلب ومتابعة الشحن.</p>
        <a href={`/`} className="block w-full py-3.5 rounded-xl text-white font-bold" style={{ backgroundColor: primaryColor }}>
          متابعة التسوق
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </a>
          <h1 className="text-base font-bold text-slate-800">إتمام الشراء</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── FORM ── */}
          <div className="lg:col-span-3 space-y-5">
            {/* Customer info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="font-bold text-slate-800 mb-4">معلومات الشحن</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">الاسم الكامل *</label>
                  <input
                    value={form.name}
                    onChange={(e) => f("name", e.target.value)}
                    required
                    placeholder="محمد العمري"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">البريد الإلكتروني *</label>
                    <input
                      value={form.email}
                      onChange={(e) => f("email", e.target.value)}
                      type="email"
                      required
                      dir="ltr"
                      placeholder="email@example.com"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">رقم الهاتف</label>
                    <input
                      value={form.phone}
                      onChange={(e) => f("phone", e.target.value)}
                      type="tel"
                      dir="ltr"
                      placeholder="+966 5x xxx xxxx"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">المدينة</label>
                    <input
                      value={form.city}
                      onChange={(e) => f("city", e.target.value)}
                      placeholder="الرياض"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">العنوان</label>
                    <input
                      value={form.address}
                      onChange={(e) => f("address", e.target.value)}
                      placeholder="الحي، الشارع، رقم المبنى"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">ملاحظات (اختياري)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => f("notes", e.target.value)}
                    rows={2}
                    placeholder="أي تعليمات خاصة للتوصيل..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Delivery method */}
            {deliveryMethods.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-slate-800 mb-4">طريقة التوصيل</h2>
                <div className="space-y-2">
                  {deliveryMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedDelivery?.id === method.id ? "border-current bg-opacity-5" : "border-slate-200 hover:border-slate-300"}`}
                      style={selectedDelivery?.id === method.id ? { borderColor: primaryColor, backgroundColor: primaryColor + "08" } : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="delivery"
                          checked={selectedDelivery?.id === method.id}
                          onChange={() => setSelectedDelivery(method)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedDelivery?.id === method.id ? "border-current" : "border-slate-300"}`} style={selectedDelivery?.id === method.id ? { borderColor: primaryColor } : undefined}>
                          {selectedDelivery?.id === method.id && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{method.name_ar ?? method.name}</p>
                          {method.estimated_days && (
                            <p className="text-xs text-slate-400">{method.estimated_days} {method.estimated_days === 1 ? "يوم" : "أيام"}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: primaryColor }}>
                        {method.fee === 0 ? "مجاني" : formatCurrency(method.fee, "SAR", "ar-SA")}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-20">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                ملخص الطلب ({cart.length})
              </h2>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                      {item.product.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-lg">🛍️</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{item.product.name_ar ?? item.product.name}</p>
                      <p className="text-xs text-slate-400">× {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-800 flex-shrink-0">
                      {formatCurrency(item.product.price * item.quantity, "SAR", "ar-SA")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 py-4 border-t border-slate-100">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(subtotal, "SAR", "ar-SA")}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>الشحن</span>
                    <span>{formatCurrency(deliveryFee, "SAR", "ar-SA")}</span>
                  </div>
                )}
                {deliveryFee === 0 && selectedDelivery && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>الشحن</span>
                    <span>مجاني 🎉</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-800 pt-2 border-t border-slate-100">
                  <span>الإجمالي</span>
                  <span style={{ color: primaryColor }}>{formatCurrency(total, "SAR", "ar-SA")}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing || !form.name || !form.email || cart.length === 0}
                className="w-full py-3.5 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: primaryColor }}
              >
                {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : "تأكيد الطلب →"}
              </button>

              <p className="text-center text-xs text-slate-400 mt-3">الدفع عند الاستلام</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}