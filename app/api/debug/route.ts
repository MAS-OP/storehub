import { NextResponse } from 'next/server'
import { createClient } from '@/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return NextResponse.json({
    user: user ? user.email : null,
    platformAdminEmail: process.env.PLATFORM_ADMIN_EMAIL,
    match: user?.email === process.env.PLATFORM_ADMIN_EMAIL,
  })
}
