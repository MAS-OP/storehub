import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Store, LayoutDashboard, Package, ShoppingBag,
  BarChart3, Calculator, Settings, Bot,
  ExternalLink, LogOut, Plug, Bell,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, name_ar, subdomain, primary_color, logo_url")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!store) redirect(`/${locale}/create`);

  // عدد الإشعارات غير المقروءة
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("store_id", store.id)
    .eq("is_read", false);

  const navItems = [
    { href: `/${locale}/admin`,              icon: LayoutDashboard, label: isAr ? "لوحة التحكم"      : "Dashboard" },
    { href: `/${locale}/admin/products`,     icon: Package,         label: isAr ? "المنتجات"          : "Products" },
    { href: `/${locale}/admin/orders`,       icon: ShoppingBag,     label: isAr ? "الطلبات"           : "Orders" },
    { href: `/${locale}/admin/analytics`,    icon: BarChart3,       label: isAr ? "التحليلات"         : "Analytics" },
    { href: `/${locale}/admin/accounting`,   icon: Calculator,      label: isAr ? "المحاسبة"          : "Accounting" },
    { href: `/${locale}/admin/integrations`, icon: Plug,            label: isAr ? "الموصلات"          : "Integrations" },
    { href: `/${locale}/admin/ai`,           icon: Bot,             label: isAr ? "المساعد الذكي"     : "AI Assistant" },
    { href: `/${locale}/admin/settings`,     icon: Settings,        label: isAr ? "الإعدادات"         : "Settings" },
    {
      href: `/${locale}/admin/notifications`,
      icon: Bell,
      label: isAr ? "الإشعارات" : "Notifications",
      badge: unreadCount ?? 0,
    },
  ];

  return (
    <div className="flex min-h-screen" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Sidebar ── */}
      <aside className="w-64 glass border-e border-white/5 flex flex-col fixed inset-y-0 start-0 z-30">
        {/* هوية المتجر */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
              style={{ backgroundColor: store.primary_color }}
            >
              {store.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Store className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {isAr ? (store.name_ar ?? store.name) : store.name}
              </p>
              <p className="text-xs text-slate-400 truncate">{store.subdomain}.storehub.sa</p>
            </div>
          </div>
        </div>

        {/* قائمة التنقل */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all group"
              >
                <Icon className="w-4 h-4 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                <span className="flex-1">{item.label}</span>
                {"badge" in item && (item.badge as number) > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">
                    {item.badge as number}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* تذييل */}
        <div className="p-3 border-t border-white/5 space-y-0.5">
          <a
            href={`https://${store.subdomain}.storehub.sa`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            {isAr ? "عرض المتجر" : "View store"}
          </a>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              {isAr ? "تسجيل الخروج" : "Sign out"}
            </button>
          </form>
        </div>
      </aside>

      {/* ── المحتوى الرئيسي ── */}
      <main className="flex-1 ms-64 min-h-screen">{children}</main>
    </div>
  );
}
