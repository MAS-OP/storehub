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
