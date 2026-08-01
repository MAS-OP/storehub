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
