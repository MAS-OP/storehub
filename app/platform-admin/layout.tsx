import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/supabase/server'

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email?.toLowerCase() !== process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase())
    redirect('/')

  return (
    <div className="min-h-screen bg-gray-950 text-white flex" dir="rtl">
      <aside className="w-56 border-l border-white/10 p-6 flex flex-col gap-1 shrink-0">
        <p className="text-indigo-400 font-bold text-lg mb-6">⚡ StoreHub Admin</p>
        <Link href="/platform-admin"         className="px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm">📊 الرئيسية</Link>
        <Link href="/platform-admin/stores"  className="px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm">🏪 المتاجر</Link>
        <Link href="/platform-admin/users"   className="px-4 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-sm">👥 المستخدمون</Link>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
