'use client'

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
