import { NextRequest, NextResponse } from 'next/server'
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
