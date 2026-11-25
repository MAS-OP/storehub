"use client";

import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";

type Props = { locale: string };

// Plain <a> on purpose: a full navigation always loads the requested
// locale and avoids client-router cache surprises when switching languages.
export default function LocaleSwitcher({ locale }: Props): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const isAr = locale === "ar";

  // Drop a leading /ar or /en segment, keep the rest of the path.
  const rest = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  const targetLocale = isAr ? "en" : "ar";
  const href = `/${targetLocale}${rest === "/" ? "" : rest}`;

  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
    >
      <Languages className="w-4 h-4" />
      {isAr ? "English" : "العربية"}
    </a>
  );
}
