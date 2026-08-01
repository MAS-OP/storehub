import { NextRequest, NextResponse } from 'next/server'
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
