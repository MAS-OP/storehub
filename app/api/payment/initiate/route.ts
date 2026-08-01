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
