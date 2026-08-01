import os

dirs = [
    'app/api/admin/store/toggle',
    'app/api/admin/store/delete',
    'app/api/admin/user/delete',
    'app/api/admin/user/reset',
    'app/platform-admin/users',
    'app/platform-admin/stores',
]
for d in dirs:
    os.makedirs(d, exist_ok=True)

# ── API: تفعيل/تعطيل متجر ──────────────────────────────────────────────────
open('app/api/admin/store/toggle/route.ts', 'w').write(
"""import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/supabase/admin'
import { createClient } from '@/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase())
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId, isActive } = await req.json() as { storeId: string; isActive: boolean }
  const { error } = await adminSupabase.from('stores').update({ is_active: isActive }).eq('id', storeId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
""")
print('✅ api/admin/store/toggle/route.ts')

# ── API: حذف متجر (cascading) ──────────────────────────────────────────────
open('app/api/admin/store/delete/route.ts', 'w').write(
"""import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/supabase/admin'
import { createClient } from '@/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase())
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storeId } = await req.json() as { storeId: string }
  const { data: orders } = await adminSupabase.from('orders').select('id').eq('store_id', storeId)
  if (orders && orders.length > 0)
    await adminSupabase.from('order_items').delete().in('order_id', orders.map(o => o.id))
  await adminSupabase.from('orders').delete().eq('store_id', storeId)
  await adminSupabase.from('products').delete().eq('store_id', storeId)
  const { error } = await adminSupabase.from('stores').delete().eq('id', storeId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
""")
print('✅ api/admin/store/delete/route.ts')

# ── API: حذف مستخدم ────────────────────────────────────────────────────────
open('app/api/admin/user/delete/route.ts', 'w').write(
"""import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/supabase/admin'
import { createClient } from '@/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase())
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await req.json() as { userId: string }
  const { error } = await adminSupabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
""")
print('✅ api/admin/user/delete/route.ts')

# ── API: إعادة تعيين كلمة المرور ──────────────────────────────────────────
open('app/api/admin/user/reset/route.ts', 'w').write(
"""import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/supabase/admin'
import { createClient } from '@/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase())
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email } = await req.json() as { email: string }
  const { error } = await adminSupabase.auth.resetPasswordForEmail(email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
""")
print('✅ api/admin/user/reset/route.ts')

# ── Layout: أضف المستخدمين للقائمة ────────────────────────────────────────
open('app/platform-admin/layout.tsx', 'w').write(
"""import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/server'

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase())
    redirect('/')

  return (
    <div className="min-h-screen bg-gray-950 text-white flex" dir="rtl">
      <aside className="w-56 border-l border-white/10 p-6 flex flex-col gap-1 shrink-0">
        <p className="text-indigo-400 font-bold text-lg mb-6">⚡ StoreHub Admin</p>
        <Link href="/platform-admin"         className="px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm">📊 الرئيسية</Link>
        <Link href="/platform-admin/stores"  className="px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm">🏪 المتاجر</Link>
        <Link href="/platform-admin/users"   className="px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm">👥 المستخدمون</Link>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
""")
print('✅ platform-admin/layout.tsx')

# ── Stores Page: بيانات شاملة ──────────────────────────────────────────────
open('app/platform-admin/stores/page.tsx', 'w').write(
"""import { adminSupabase } from '@/supabase/admin'
import StoresManager from './StoresManager'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
  const [
    { data: stores },
    { data: products },
    { data: orders },
    { data: { users } },
  ] = await Promise.all([
    adminSupabase.from('stores').select('id, name, name_ar, subdomain, is_active, created_at, owner_id').order('created_at', { ascending: false }),
    adminSupabase.from('products').select('id, store_id'),
    adminSupabase.from('orders').select('id, store_id, total, status'),
    adminSupabase.auth.admin.listUsers(),
  ])

  const userMap = Object.fromEntries(users.map(u => [u.id, u.email ?? '']))

  const storeList = (stores ?? []).map(store => ({
    id: store.id as string,
    name: store.name as string,
    name_ar: store.name_ar as string | null,
    subdomain: store.subdomain as string,
    is_active: (store.is_active ?? true) as boolean,
    created_at: store.created_at as string,
    owner_id: store.owner_id as string,
    ownerEmail: userMap[store.owner_id as string] ?? 'غير معروف',
    productsCount: (products ?? []).filter(p => p.store_id === store.id).length,
    ordersCount: (orders ?? []).filter(o => o.store_id === store.id).length,
    revenue: (orders ?? [])
      .filter(o => o.store_id === store.id && o.status === 'confirmed')
      .reduce((sum, o) => sum + ((o.total as number) ?? 0), 0),
  }))

  return <StoresManager stores={storeList} />
}
""")
print('✅ stores/page.tsx')

# ── StoresManager ──────────────────────────────────────────────────────────
open('app/platform-admin/stores/StoresManager.tsx', 'w').write(
"""'use client'

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
""")
print('✅ StoresManager.tsx')

# ── Users Page ─────────────────────────────────────────────────────────────
open('app/platform-admin/users/page.tsx', 'w').write(
"""import { adminSupabase } from '@/supabase/admin'
import UsersManager from './UsersManager'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const [
    { data: { users } },
    { data: stores },
  ] = await Promise.all([
    adminSupabase.auth.admin.listUsers(),
    adminSupabase.from('stores').select('owner_id, id, name'),
  ])

  const storeMap = Object.fromEntries(
    (stores ?? []).map(s => [s.owner_id as string, { id: s.id as string, name: s.name as string }])
  )

  const userList = users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    created_at: u.created_at,
    storeName: storeMap[u.id]?.name ?? null,
    storeId: storeMap[u.id]?.id ?? null,
  }))

  return <UsersManager users={userList} />
}
""")
print('✅ users/page.tsx')

# ── UsersManager ───────────────────────────────────────────────────────────
open('app/platform-admin/users/UsersManager.tsx', 'w').write(
"""'use client'

import { useState } from 'react'

interface UserWithStore {
  id: string
  email: string
  created_at: string
  storeName: string | null
  storeId: string | null
}

export default function UsersManager({ users: initial }: { users: UserWithStore[] }) {
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState<string | null>(null)

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.storeName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function deleteUser(id: string): Promise<void> {
    setLoading(id)
    const res = await fetch('/api/admin/user/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id }),
    })
    if (res.ok) setUsers(prev => prev.filter(u => u.id !== id))
    setConfirm(null)
    setLoading(null)
  }

  async function resetPassword(email: string): Promise<void> {
    setLoading(email)
    await fetch('/api/admin/user/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setResetSent(email)
    setLoading(null)
    setTimeout(() => setResetSent(null), 3000)
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">المستخدمون ({users.length})</h1>
        <input
          type="text"
          placeholder="بحث بالإيميل أو اسم المتجر..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-72 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 text-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm">{u.email}</p>
              <div className="flex gap-3 mt-1 text-xs text-white/40">
                {u.storeName
                  ? <span className="text-indigo-400">🏪 {u.storeName}</span>
                  : <span>بدون متجر</span>}
                <span>📅 {new Date(u.created_at).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => resetPassword(u.email)}
                disabled={loading === u.email}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
              >
                {resetSent === u.email ? '✅ أُرسل' : loading === u.email ? '...' : 'إعادة كلمة المرور'}
              </button>
              {confirm === u.id ? (
                <div className="flex gap-1">
                  <button onClick={() => deleteUser(u.id)} disabled={loading === u.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                    تأكيد الحذف
                  </button>
                  <button onClick={() => setConfirm(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white/60 hover:bg-white/20">
                    إلغاء
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirm(u.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                  حذف
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-white/30 py-12">لا توجد نتائج</p>}
      </div>
    </div>
  )
}
""")
print('✅ UsersManager.tsx')

print()
print('🎉 اكتمل!')
