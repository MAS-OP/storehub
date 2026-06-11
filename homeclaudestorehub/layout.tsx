import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StoreHub — متجرك الإلكتروني، تملكه للأبد",
    template: "%s | StoreHub",
  },
  description:
    "منصة لبناء متاجر إلكترونية احترافية بدفعة واحدة. بلا اشتراكات، بلا رسوم شهرية.",
  keywords: ["متجر إلكتروني", "تجارة إلكترونية", "store builder", "ecommerce"],
  authors: [{ name: "StoreHub" }],
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
    siteName: "StoreHub",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
