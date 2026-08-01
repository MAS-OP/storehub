#!/bin/bash
set -e
echo "🚀 إنشاء الملفات الناقصة لـ StoreHub..."

# ─── supabase/admin.ts ────────────────────────────────────────────
mkdir -p supabase
cat > supabase/admin.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/supabase/types'

// Service role client — bypasses RLS. Server-side only.
export const adminSupabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
EOF

# ─── app/platform-admin/layout.tsx ───────────────────────────────
mkdir -p app/platform-admin
cat > app/platform-admin/layout.tsx << 'EOF'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/server'

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.PLATFORM_ADMIN_EMAIL) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-56 border-r border-white/10 p-6 flex flex-col gap-1 shrink-0">
        <p className="text-indigo-400 font-bold text-base mb-6">⚡ StoreHub Admin</p>
        <Link
          href="/platform-admin"
          className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          الإيرادات
        </Link>
        <Link
          href="/platform-admin/stores"
          className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          المتاجر
        </Link>
      </aside>
      <main className="flex-1 p-8" dir="rtl">
        {children}
      </main>
    </div>
  )
}
EOF

# ─── app/platform-admin/page.tsx ─────────────────────────────────
cat > app/platform-admin/page.tsx << 'EOF'
import { adminSupabase } from '@/supabase/admin'

export const dynamic = 'force-dynamic'

interface StoreRow {
  id: string
  name: string
  created_at: string
}

interface OrderRow {
  total: number
  status: string
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: 'indigo' | 'green' | 'amber'
}) {
  const colors: Record<'indigo' | 'green' | 'amber', string> = {
    indigo: 'border-indigo-500/30 text-indigo-400',
    green: 'border-green-500/30 text-green-400',
    amber: 'border-amber-500/30 text-amber-400',
  }
  return (
    <div className={`bg-white/5 border rounded-xl p-6 ${colors[color]}`}>
      <p className="text-white/50 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}

export default async function PlatformAdminPage() {
  const [{ data: stores }, { data: orders }] = await Promise.all([
    adminSupabase
      .from('stores')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
    adminSupabase.from('orders').select('total, status'),
  ])

  const safeStores = (stores ?? []) as StoreRow[]
  const safeOrders = (orders ?? []) as OrderRow[]

  const totalRevenue = safeOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const confirmedOrders = safeOrders.filter((o) => o.status === 'confirmed').length

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">لوحة إيرادات المنصة</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="إجمالي المتاجر" value={safeStores.length} color="indigo" />
        <StatCard label="الطلبات المؤكدة" value={confirmedOrders} color="green" />
        <StatCard
          label="الإيرادات الكلية"
          value={`${totalRevenue.toLocaleString('ar-SA')} ر.س`}
          color="amber"
        />
      </div>

      <h2 className="text-xl font-semibold mb-4">أحدث المتاجر</h2>
      <div className="space-y-2">
        {safeStores.map((store) => (
          <div
            key={store.id}
            className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex justify-between items-center"
          >
            <span className="font-medium">{store.name}</span>
            <span className="text-white/40 text-sm">
              {new Date(store.created_at).toLocaleDateString('ar-SA')}
            </span>
          </div>
        ))}
        {safeStores.length === 0 && (
          <p className="text-center text-white/40 py-10">لا توجد متاجر بعد</p>
        )}
      </div>
    </div>
  )
}
EOF

# ─── app/platform-admin/stores/page.tsx ──────────────────────────
mkdir -p app/platform-admin/stores
cat > app/platform-admin/stores/page.tsx << 'EOF'
import { adminSupabase } from '@/supabase/admin'
import StoresManager from './StoresManager'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
  const { data: stores } = await adminSupabase
    .from('stores')
    .select('id, name, subdomain, created_at')
    .order('created_at', { ascending: false })

  return <StoresManager stores={stores ?? []} />
}
EOF

# ─── app/platform-admin/stores/StoresManager.tsx ─────────────────
cat > app/platform-admin/stores/StoresManager.tsx << 'EOF'
'use client'

import { useState } from 'react'

interface Store {
  id: string
  name: string
  subdomain: string
  created_at: string
}

export default function StoresManager({ stores }: { stores: Store[] }) {
  const [search, setSearch] = useState('')

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.subdomain.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">المتاجر ({stores.length})</h1>
      <input
        type="text"
        placeholder="بحث بالاسم أو الرابط..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 mb-6 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500"
        dir="rtl"
      />
      <div className="space-y-3">
        {filtered.map((store) => (
          <div
            key={store.id}
            className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold">{store.name}</p>
              <p className="text-white/40 text-sm mt-0.5">
                {store.subdomain}.storehub.sa
              </p>
            </div>
            <span className="text-white/30 text-xs">
              {new Date(store.created_at).toLocaleDateString('ar-SA')}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-white/30 py-12">لا توجد نتائج</p>
        )}
      </div>
    </div>
  )
}
EOF

# ─── app/api/email/order/route.ts ────────────────────────────────
mkdir -p app/api/email/order
cat > app/api/email/order/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'

interface OrderItem {
  name: string
  qty: number
  price: number
}

interface EmailOrderPayload {
  to: string
  customerName: string
  orderNumber: string
  storeName: string
  items: OrderItem[]
  total: number
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Silently skip if Resend not configured
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { to, customerName, orderNumber, storeName, items, total } =
    (await req.json()) as EmailOrderPayload

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h2 style="color:#4f46e5;">شكراً لطلبك، ${customerName}!</h2>
      <p>تم استلام طلبك رقم <strong>#${orderNumber}</strong> من <strong>${storeName}</strong> بنجاح.</p>
      <hr style="border-color:#eee;margin:20px 0;" />
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f9fafb;text-align:right;">
            <th style="padding:10px;border-bottom:1px solid #eee;">المنتج</th>
            <th style="padding:10px;border-bottom:1px solid #eee;">الكمية</th>
            <th style="padding:10px;border-bottom:1px solid #eee;">السعر</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${item.name}</td>
              <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${item.qty}</td>
              <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${item.price} ر.س</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <hr style="border-color:#eee;margin:20px 0;" />
      <p style="font-size:18px;"><strong>الإجمالي: ${total} ر.س</strong></p>
      <p style="color:#6b7280;margin-top:24px;">سيتم التواصل معك قريباً لتأكيد الشحن.</p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${storeName} <orders@storehub.sa>`,
      to: [to],
      subject: `تأكيد طلبك رقم #${orderNumber} — ${storeName}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = (await res.json()) as unknown
    return NextResponse.json({ ok: false, error: err }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
EOF

# ─── app/api/payment/initiate/route.ts ───────────────────────────
mkdir -p app/api/payment/initiate
cat > app/api/payment/initiate/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'

interface InitiatePayload {
  amount: number
  description: string
  orderId: string
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.MOYASAR_SECRET_KEY) {
    return NextResponse.json(
      { error: 'MOYASAR_SECRET_KEY غير مضاف في .env.local' },
      { status: 503 }
    )
  }

  const { amount, description, orderId } = (await req.json()) as InitiatePayload

  const basicAuth = Buffer.from(`${process.env.MOYASAR_SECRET_KEY}:`).toString('base64')
  const callbackUrl = `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/api/payment/callback`

  const res = await fetch('https://api.moyasar.com/v1/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100), // تحويل إلى هللة
      currency: 'SAR',
      description,
      callback_url: callbackUrl,
      metadata: { order_id: orderId },
      source: { type: 'creditcard' },
    }),
  })

  const data = (await res.json()) as unknown

  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: res.status })
  }

  return NextResponse.json(data)
}
EOF

# ─── app/api/payment/callback/route.ts ───────────────────────────
mkdir -p app/api/payment/callback
cat > app/api/payment/callback/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/supabase/admin'

// POST: Moyasar webhook (server-to-server) — uses adminSupabase to bypass RLS
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as {
    id: string
    status: string
    metadata?: { order_id?: string }
  }

  const { id: paymentId, status, metadata } = body
  const orderId = metadata?.order_id

  if (!orderId) {
    return NextResponse.json({ error: 'order_id مفقود في metadata' }, { status: 400 })
  }

  if (status !== 'paid') {
    return NextResponse.json({ ok: false, status })
  }

  const { error } = await adminSupabase
    .from('orders')
    .update({ status: 'confirmed' })
    .eq('id', orderId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, paymentId })
}

// GET: إعادة توجيه المتصفح بعد الدفع
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const paymentId = searchParams.get('id')
  const baseUrl = `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`

  if (status === 'paid') {
    return NextResponse.redirect(`${baseUrl}/checkout/success?payment=${paymentId}`)
  }

  return NextResponse.redirect(`${baseUrl}/checkout/failed?payment=${paymentId}`)
}
EOF

echo ""
echo "✅ تم إنشاء جميع الملفات بنجاح!"
echo ""
echo "الملفات المنشأة:"
echo "  • supabase/admin.ts"
echo "  • app/platform-admin/layout.tsx"
echo "  • app/platform-admin/page.tsx"
echo "  • app/platform-admin/stores/page.tsx"
echo "  • app/platform-admin/stores/StoresManager.tsx"
echo "  • app/api/email/order/route.ts"
echo "  • app/api/payment/initiate/route.ts"
echo "  • app/api/payment/callback/route.ts"
