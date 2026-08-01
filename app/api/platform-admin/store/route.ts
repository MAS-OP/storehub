import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/supabase/admin'
import { createClient } from '@/supabase/server'

async function isPlatformAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email?.toLowerCase() === process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase()
}

// تفعيل / تعطيل متجر
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!await isPlatformAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, is_active } = (await req.json()) as { id: string; is_active: boolean }
  const { error } = await adminSupabase.from('stores').update({ is_active }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// حذف متجر وجميع بياناته
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!await isPlatformAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = (await req.json()) as { id: string }

  const { data: orders } = await adminSupabase.from('orders').select('id').eq('store_id', id)
  const orderIds = (orders ?? []).map(o => o.id)
  if (orderIds.length > 0) await adminSupabase.from('order_items').delete().in('order_id', orderIds)

  await Promise.all([
    adminSupabase.from('orders').delete().eq('store_id', id),
    adminSupabase.from('products').delete().eq('store_id', id),
  ])
  const { error } = await adminSupabase.from('stores').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
