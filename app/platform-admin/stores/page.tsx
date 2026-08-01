import { adminSupabase } from '@/supabase/admin'
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
