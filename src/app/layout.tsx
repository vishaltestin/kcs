import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kcsgmart.in"),
  title: {
    default: "KCS G-Mart — Corporate Gifting Company in India",
    template: "%s | KCS G-Mart",
  },
  description:
    "KCS G-Mart — India's most trusted corporate gifting company. Branded gifts, hampers, joining kits and promotional merchandise with pan-India delivery.",
  keywords: [
    "corporate gifting",
    "corporate gifts India",
    "branded merchandise",
    "gift hampers",
    "joining kits",
    "KCS G-Mart",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <TooltipProvider delayDuration={200}>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
