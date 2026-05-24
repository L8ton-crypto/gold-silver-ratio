import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoldSilverRatio - Is silver actually cheap?",
  description:
    "Live gold/silver ratio with 12-month band. One number tells you whether silver is screaming buy, screaming sell, or noise.",
  openGraph: {
    title: "GoldSilverRatio",
    description: "Live gold/silver ratio with 12-month statistical band.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
