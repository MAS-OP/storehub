import type { Metadata } from "next";
import "./globals.css";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: {
    default: "StoreHub — متجرك الإلكتروني، تملكه للأبد",
    template: "%s | StoreHub",
  },
  description: "منصة لبناء متاجر إلكترونية احترافية بدفعة واحدة.",
  openGraph: { type: "website", locale: "ar_SA", siteName: "StoreHub" },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&display=swap" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="animated-bg min-h-screen">{children}</body>
    </html>
  );
}