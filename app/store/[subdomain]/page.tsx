"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/supabase/client";
import {
  ShoppingCart, X, Plus, Minus, Bot, Send, MessageCircle,
  Loader2, Store, Search, ChevronLeft,
} from "lucide-react";
import { formatCurrency } from "@/utils";
import type { Database } from "@/supabase/types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface CartItem { product: Product; quantity: number }
interface ChatMsg { role: "user" | "assistant"; content: string }

const CART_KEY = (sub: string) => `storehub_cart_${sub}`;

export default function StorePage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const supabase = createClient();

  const [store, setStore] = useState<StoreRow | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // ── Load store data ────────────────────────────────────
  useEffect(() => {
    if (!subdomain) return;
    loadStore();
    // Restore cart from localStorage
    try {
      const saved = localStorage.getItem(CART_KEY(subdomain));
      if (saved) setCart(JSON.parse(saved));
    } catch {}
  }, [subdomain]);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (!subdomain) return;
    localStorage.setItem(CART_KEY(subdomain), JSON.stringify(cart));
  }, [cart, subdomain]);

  async function loadStore() {
    const { data } = await supabase
      .from("stores")
      .select("*, products(*), categories(*)")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .single();

    if (!data) { setLoading(false); return; }

    const store = data as unknown as StoreRow & {
      products: Product[];
      categories: Category[];
    };

    setStore(store);
    // Sort categories and products
    const cats = store.categories.sort((a, b) => a.sort_order - b.sort_order);
    const prods = store.products.filter((p) => p.is_active);
    setCategories(cats);
    setProducts(prods);
    setLoading(false);

    // Set page title and favicon color
    document.title = store.name_ar ?? store.name;
  }

  // ── Cart helpers ───────────────────────────────────────
  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => {
      const updated = prev.map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i);
      return updated.filter((i) => i.quantity > 0);
    });
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  // ── Filtered products ───────────────────────────────────
  const filtered = products.filter((p) => {
    const inCategory = activeCategory === "all" || p.category_id === activeCategory;
    const inSearch = !search || [p.name, p.name_ar].some(n => n?.toLowerCase().includes(search.toLowerCase()));
    return inCategory && inSearch;
  });

  // ── AI chat ─────────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim() || !store || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const userMsg: ChatMsg = { role: "user", content: msg };
    setChatMessages((p) => [...p, userMsg]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, storeId: store.id, history: chatMessages }),
      });
      const data = await res.json();
      setChatMessages((p) => [...p, { role: "assistant", content: data.reply ?? "عذراً، حدث خطأ." }]);
    } catch {
      setChatMessages((p) => [...p, { role: "assistant", content: "عذراً، حدث خطأ. حاول مجدداً." }]);
    } finally {
      setChatLoading(false);
    }
  }

  const primaryColor = store?.primary_color ?? "#4F46E5";
  const isAr = true; // Store is Arabic-first

  // ── Loading ─────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: "transparent" }} />
    </div>
  );

  if (!store) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Store className="w-12 h-12 text-slate-400" />
      <p className="text-slate-500">المتجر غير موجود</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo + name */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primaryColor }}>
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (store.name_ar?.[0] ?? store.name[0])}
            </div>
            <span className="font-bold text-slate-800 text-sm">{store.name_ar ?? store.name}</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-sm">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm"
            />
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">السلة</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -start-1.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Category tabs */}
        <div className="border-t border-slate-100 overflow-x-auto">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 py-2 min-w-max">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeCategory === "all" ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
              style={activeCategory === "all" ? { backgroundColor: primaryColor } : undefined}
            >
              الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${activeCategory === cat.id ? "text-white" : "text-slate-500 hover:text-slate-700"}`}
                style={activeCategory === cat.id ? { backgroundColor: primaryColor } : undefined}
              >
                {cat.name_ar ?? cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── PRODUCTS ── */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">{search ? "لا توجد نتائج" : "لا توجد منتجات في هذا التصنيف"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Product image */}
                  <div className="aspect-square bg-slate-100 overflow-hidden relative">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.images[0]} alt={product.name_ar ?? product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-slate-200">🛍️</div>
                    )}
                    {product.compare_price && product.compare_price > product.price && (
                      <span className="absolute top-2 start-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        خصم
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">نفذ المخزون</span>
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2 leading-snug">
                      {product.name_ar ?? product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-black" style={{ color: primaryColor }}>
                        {formatCurrency(product.price, "SAR", "ar-SA")}
                      </span>
                      {product.compare_price && product.compare_price > product.price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.compare_price, "SAR", "ar-SA")}
                        </span>
                      )}
                    </div>

                    {product.stock > 0 ? (
                      inCart ? (
                        <div className="flex items-center justify-between rounded-xl overflow-hidden border" style={{ borderColor: primaryColor }}>
                          <button onClick={() => updateQty(product.id, -1)} className="p-2 hover:bg-slate-50 transition-colors">
                            <Minus className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                          </button>
                          <span className="text-sm font-bold" style={{ color: primaryColor }}>{inCart.quantity}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="p-2 hover:bg-slate-50 transition-colors">
                            <Plus className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full py-2 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                          style={{ backgroundColor: primaryColor }}
                        >
                          أضف للسلة
                        </button>
                      )
                    ) : (
                      <button disabled className="w-full py-2 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">
                        نفذ المخزون
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative z-10 bg-white w-full max-w-md ms-auto flex flex-col shadow-2xl">
            {/* Cart header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="text-lg font-bold text-slate-800">السلة ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">سلتك فارغة</p>
                </div>
              ) : cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                    {item.product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xl">🛍️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.product.name_ar ?? item.product.name}</p>
                    <p className="text-sm font-bold" style={{ color: primaryColor }}>{formatCurrency(item.product.price, "SAR", "ar-SA")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                      <Minus className="w-3 h-3 text-slate-600" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">
                      <Plus className="w-3 h-3 text-slate-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t space-y-3">
                <div className="flex items-center justify-between text-base font-bold text-slate-800">
                  <span>الإجمالي</span>
                  <span style={{ color: primaryColor }}>{formatCurrency(cartTotal, "SAR", "ar-SA")}</span>
                </div>
                <Link
                  href={`/checkout`}
                  onClick={() => setCartOpen(false)}
                  className="block w-full py-3.5 rounded-xl text-white text-center font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  إتمام الشراء ←
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI CHAT ── */}
      {store.ai_enabled && (
        <div className="fixed bottom-5 start-5 z-40">
          {chatOpen ? (
            <div className="bg-white rounded-2xl shadow-2xl w-80 flex flex-col overflow-hidden" style={{ height: "420px" }}>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor: primaryColor }}>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  <span className="text-sm font-semibold">مساعد المتجر</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                </div>
                <button onClick={() => setChatOpen(false)} className="hover:opacity-70"><X className="w-4 h-4" /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <Bot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    مرحباً! كيف يمكنني مساعدتك؟
                  </div>
                )}
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl leading-relaxed ${m.role === "user" ? "bg-slate-100 text-slate-700" : "text-white"}`} style={m.role === "assistant" ? { backgroundColor: primaryColor } : undefined}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-end">
                    <div className="text-white text-xs px-3 py-2 rounded-xl" style={{ backgroundColor: primaryColor }}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="اسألني أي شيء..."
                  className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-100 outline-none text-slate-700 placeholder-slate-400"
                />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading} className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setChatOpen(true)} className="w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-transform hover:scale-110" style={{ backgroundColor: primaryColor }}>
              <MessageCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}