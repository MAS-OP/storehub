'use client'

import { useState } from 'react'

interface StoreWithStats {
  id: string
  name: string
  name_ar: string | null
  subdomain: string
  is_active: boolean
  created_at: string
  owner_id: string
  ownerEmail: string
  productsCount: number
  ordersCount: number
  revenue: number
}

export default function StoresManager({ stores: initial }: { stores: StoreWithStats[] }) {
  const [stores, setStores] = useState(initial)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.subdomain.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerEmail.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleStore(id: string, current: boolean): Promise<void> {
    setLoading(id)
    const res = await fetch('/api/admin/store/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: id, isActive: !current }),
    })
    if (res.ok) setStores(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
    setLoading(null)
  }

  async function deleteStore(id: string): Promise<void> {
    setLoading(id)
    const res = await fetch('/api/admin/store/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: id }),
    })
    if (res.ok) setStores(prev => prev.filter(s => s.id !== id))
    setConfirm(null)
    setLoading(null)
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">المتاجر ({stores.length})</h1>
        <input
          type="text"
          placeholder="بحث بالاسم أو الرابط أو الإيميل..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-72 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 text-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.map(store => (
          <div key={store.id} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{store.name}</span>
                  {store.name_ar && <span className="text-white/40 text-sm">({store.name_ar})</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${store.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {store.is_active ? 'نشط' : 'معطّل'}
                  </span>
                </div>
                <p className="text-white/40 text-sm">{store.subdomain}.storehub.sa · {store.ownerEmail}</p>
                <div className="flex gap-4 mt-2 text-xs text-white/50">
                  <span>🛍 {store.productsCount} منتج</span>
                  <span>📦 {store.ordersCount} طلب</span>
                  <span>💰 {store.revenue.toLocaleString('ar-SA')} ر.س</span>
                  <span>📅 {new Date(store.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleStore(store.id, store.is_active)}
                  disabled={loading === store.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                    store.is_active
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  {loading === store.id ? '...' : store.is_active ? 'تعطيل' : 'تفعيل'}
                </button>
                {confirm === store.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => deleteStore(store.id)} disabled={loading === store.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                      تأكيد الحذف
                    </button>
                    <button onClick={() => setConfirm(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/60 hover:bg-white/20">
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirm(store.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                    حذف
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 py-12">لا توجد نتائج</p>}
      </div>
    </div>
  )
}
