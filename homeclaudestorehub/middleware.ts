import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "storehub.sa";

function getSubdomain(request: NextRequest): string | null {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  // Local development: store.localhost
  if (hostname.endsWith(".localhost")) {
    return hostname.replace(".localhost", "");
  }

  // Vercel preview: store---branch-team.vercel.app
  if (hostname.includes("---") && hostname.endsWith(".vercel.app")) {
    return hostname.split("---")[0];
  }

  // Production: store.storehub.sa
  const root = ROOT_DOMAIN.split(":")[0];
  if (
    hostname !== root &&
    hostname !== `www.${root}` &&
    hostname.endsWith(`.${root}`)
  ) {
    return hostname.replace(`.${root}`, "");
  }

  return null;
}

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const subdomain = getSubdomain(request);

  // Block common attack paths
  const blocked = ["/.env", "/wp-admin", "/phpmyadmin"];
  if (blocked.some((p) => pathname.startsWith(p))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Store subdomain request
  if (subdomain) {
    // Prevent accessing platform admin from store domain
    if (pathname.startsWith("/platform-admin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Rewrite to /store/[subdomain]/...
    const url = request.nextUrl.clone();
    url.pathname = `/store/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Main domain — apply i18n
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
