import type { Metadata } from "next";
import OnyxHero from "@/components/preview/onyx/OnyxHero";

export const metadata: Metadata = {
  title: "StoreHub — Onyx theme preview",
};

export default function OnyxPreviewPage(): React.JSX.Element {
  return (
    <>
      {/* Next 15 hoists this into <head>. Scoped here so the root layout and
          the live landing page stay untouched by this theme's font. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;500;600;700&display=swap"
      />
      <style>{`
        .onyx-title { letter-spacing: -0.04em; line-height: 0.95; }
        [dir="rtl"] .onyx-title { letter-spacing: 0; line-height: 1.15; }
      `}</style>
      <OnyxHero />
    </>
  );
}
