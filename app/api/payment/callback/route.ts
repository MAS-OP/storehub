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
