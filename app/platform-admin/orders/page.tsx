import { adminSupabase } from '@/supabase/admin'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'معلّق',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  confirmed: { label: 'مؤكد',   color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  cancelled: { label: 'ملغي',   color: 'text-red-400 bg-red-500/10 border-red-500/30' },
}

export default async function OrdersPage() {
  const [{ data: orders }, { data: stores }] = await Promise.all([
    adminSupabase.from('orders').select('id, store_id, total, status, created_at').order('created_at', { ascending: false }).limit(200),
    adminSupabase.from('stores').select('id, name, subdomain'),
  ])

  const storeMap = Object.fromEntries((stores ?? []).map(s => [s.id, s]))
  const safeOrders = orders ?? []
  const totalRevenue = safeOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">جميع الطلبات ({safeOrders.length})</h1>
        <p className="text-amber-400 font-bold text-xl">{totalRevenue.toLocaleString('ar-SA')} ر.س</p>
      </div>
      <div className="space-y-2">
        {safeOrders.map(order => {
          const store = storeMap[order.store_id]
          const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, color: 'text-white/50 bg-white/5 border-white/10' }
          return (
            <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{store?.name ?? 'متجر محذوف'}</p>
                <p className="text-white/30 text-xs">{store?.subdomain}.storehub.sa</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusInfo.color}`}>{statusInfo.label}</span>
                <span className="text-amber-400 font-semibold">{(order.total ?? 0).toLocaleString('ar-SA')} ر.س</span>
                <span className="text-white/30 text-xs">{new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
          )
        })}
        {safeOrders.length === 0 && <p className="text-center text-white/30 py-12">لا توجد طلبات بعد</p>}
      </div>
    </div>
  )
}
