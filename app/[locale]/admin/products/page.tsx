"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";
import { useLocale } from "next-intl";
import {
  Plus, Pencil, Trash2, X, Loader2, Package,
  ToggleLeft, ToggleRight, CheckCircle, AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/utils";
import type { Database } from "@/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

const empty: Omit<ProductInsert, "store_id"> = {
  name: "", name_ar: "", description: "", description_ar: "",
  price: 0, compare_price: null, stock: 0, sku: null,
  images: [], is_active: true, category_id: null, weight: null,
};

export default function ProductsPage() {
  const supabase = createClient();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [storeId, setStoreId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  useEffect(() => { loadProducts(); }, []);

  function showToast(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).single();
    if (!store) return;
    setStoreId(store.id);
    const { data } = await supabase.from("products").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }

  function openAdd() { setForm(empty); setEditId(null); setModal("add"); }
  function openEdit(p: Product) {
    setForm({
      name: p.name, name_ar: p.name_ar ?? "", description: p.description ?? "",
      description_ar: p.description_ar ?? "", price: p.price, compare_price: p.compare_price,
      stock: p.stock, sku: p.sku, images: p.images, is_active: p.is_active,
      category_id: p.category_id, weight: p.weight,
    });
    setEditId(p.id);
    setModal("edit");
  }

  async function handleSave() {
    if (!storeId || !form.name || form.price < 0) return;
    setSaving(true);
    if (modal === "add") {
      const { error } = await supabase.from("products").insert({ ...form, store_id: storeId });
      if (error) showToast(isAr ? "حدث خطأ" : "Error saving", "err");
      else showToast(isAr ? "تم إضافة المنتج" : "Product added", "ok");
    } else if (editId) {
      const { error } = await supabase.from("products").update(form).eq("id", editId);
      if (error) showToast(isAr ? "حدث خطأ" : "Error updating", "err");
      else showToast(isAr ? "تم التحديث" : "Product updated", "ok");
    }
    setSaving(false);
    setModal(null);
    loadProducts();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) showToast(isAr ? "حدث خطأ" : "Error deleting", "err");
    else { showToast(isAr ? "تم الحذف" : "Deleted", "ok"); setDeleteId(null); loadProducts(); }
  }

  async function toggleActive(p: Product) {
    await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
    loadProducts();
  }

  const f = (field: keyof typeof form, val: unknown) => setForm((prev) => ({ ...prev, [field]: val }));

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl" dir={isAr ? "rtl" : "ltr"}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 end-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-xl ${toast.type === "ok" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
          {toast.type === "ok" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">{isAr ? "المنتجات" : "Products"}</h1>
          <p className="text-slate-400 text-sm mt-1">{products.length} {isAr ? "منتج" : "products"}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-white font-semibold text-sm glow-brand hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          {isAr ? "إضافة منتج" : "Add product"}
        </button>
      </div>

      {/* Products table */}
      {products.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">{isAr ? "لا توجد منتجات بعد" : "No products yet"}</p>
          <button onClick={openAdd} className="px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold">
            {isAr ? "أضف منتجك الأول" : "Add your first product"}
          </button>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {[isAr ? "المنتج" : "Product", isAr ? "السعر" : "Price", isAr ? "المخزون" : "Stock", isAr ? "الحالة" : "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-start text-xs font-medium text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : <Package className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{isAr ? (p.name_ar ?? p.name) : p.name}</p>
                        {p.sku && <p className="text-xs text-slate-500">SKU: {p.sku}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-white">{formatCurrency(p.price, "SAR", isAr ? "ar-SA" : "en-US")}</p>
                    {p.compare_price && <p className="text-xs text-slate-500 line-through">{formatCurrency(p.compare_price, "SAR", isAr ? "ar-SA" : "en-US")}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${p.stock > 0 ? "text-white" : "text-red-400"}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleActive(p)} className="flex items-center gap-1.5 text-xs">
                      {p.is_active ? (
                        <><ToggleRight className="w-5 h-5 text-emerald-400" /><span className="text-emerald-400">{isAr ? "نشط" : "Active"}</span></>
                      ) : (
                        <><ToggleLeft className="w-5 h-5 text-slate-500" /><span className="text-slate-500">{isAr ? "مخفي" : "Hidden"}</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-lg glass rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {modal === "add" ? (isAr ? "إضافة منتج" : "Add product") : (isAr ? "تعديل المنتج" : "Edit product")}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "الاسم بالعربية *" : "Name (Arabic) *"}</label>
                  <input value={form.name_ar ?? ""} onChange={(e) => f("name_ar", e.target.value)} dir="rtl" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="عطر الفاخر" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "الاسم بالإنجليزية *" : "Name (English) *"}</label>
                  <input value={form.name} onChange={(e) => f("name", e.target.value)} dir="ltr" required className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Luxury Perfume" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "الوصف بالعربية" : "Description (Arabic)"}</label>
                <textarea value={form.description_ar ?? ""} onChange={(e) => f("description_ar", e.target.value)} dir="rtl" rows={2} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="وصف المنتج..." />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "السعر (ر.س) *" : "Price (SAR) *"}</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => f("price", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "السعر الأصلي" : "Compare price"}</label>
                  <input type="number" min="0" step="0.01" value={form.compare_price ?? ""} onChange={(e) => f("compare_price", e.target.value ? parseFloat(e.target.value) : null)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "المخزون *" : "Stock *"}</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => f("stock", parseInt(e.target.value) || 0)} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">{isAr ? "رابط الصورة الرئيسية" : "Main image URL"}</label>
                <input value={form.images[0] ?? ""} onChange={(e) => f("images", e.target.value ? [e.target.value] : [])} dir="ltr" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://..." />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">SKU ({isAr ? "اختياري" : "optional"})</label>
                <input value={form.sku ?? ""} onChange={(e) => f("sku", e.target.value || null)} dir="ltr" className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="PRD-001" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => f("is_active", e.target.checked)} className="sr-only" />
                <div className={`w-10 h-6 rounded-full transition-colors ${form.is_active ? "bg-indigo-500" : "bg-white/10"} flex items-center px-0.5`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <span className="text-sm text-slate-300">{isAr ? "منتج نشط (ظاهر للعملاء)" : "Active (visible to customers)"}</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl glass text-slate-300 font-medium hover:bg-white/5 transition-all">{isAr ? "إلغاء" : "Cancel"}</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 py-2.5 rounded-xl gradient-brand text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isAr ? "حفظ" : "Save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 glass rounded-2xl p-6 w-full max-w-sm text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">{isAr ? "حذف المنتج؟" : "Delete product?"}</h3>
            <p className="text-slate-400 text-sm mb-6">{isAr ? "هذا الإجراء لا يمكن التراجع عنه." : "This action cannot be undone."}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl glass text-slate-300 font-medium">{isAr ? "إلغاء" : "Cancel"}</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors">{isAr ? "حذف" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
