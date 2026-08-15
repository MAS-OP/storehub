import type { Metadata } from "next";
import AxonBackground from "@/components/preview/axon/AxonBackground";
import AxonHero from "@/components/preview/axon/AxonHero";

export const metadata: Metadata = {
  title: "StoreHub — Axon theme preview",
};

export default function AxonPreviewPage(): React.JSX.Element {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AxonBackground />
      <div className="relative z-10">
        <AxonHero />
      </div>
    </div>
  );
}
