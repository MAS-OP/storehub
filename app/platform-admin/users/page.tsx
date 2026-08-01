import { adminSupabase } from '@/supabase/admin'
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
