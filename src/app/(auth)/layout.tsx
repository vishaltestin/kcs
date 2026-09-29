import Link from "next/link";
import { ArrowLeft, BadgeCheck, ShieldCheck, Truck } from "lucide-react";

import { LogoMark } from "@/components/shared/logo";

const PROOF = [
  { icon: BadgeCheck, text: "500+ corporate clients" },
  { icon: Truck, text: "19,000+ PIN codes served" },
  { icon: ShieldCheck, text: "GST invoice on every order" },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-screen flex-col px-6 py-6 md:px-10 md:py-8">
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(60%_50%_at_50%_0%,black,transparent)]"
      />

      <header className="relative flex items-center justify-between">
        <Link href="/" aria-label="KCS G-Mart home">
          <LogoMark height={46} withLink={false} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back to store
        </Link>
      </header>

      <main className="relative flex flex-1 items-center justify-center py-10 md:py-14">
        <div className="w-full max-w-lg md:max-w-xl">{children}</div>
      </main>

      <footer className="relative flex flex-col items-center gap-4">
        <ul className="flex flex-wrap items-center justify-center gap-2.5">
          {PROOF.map((p) => (
            <li
              key={p.text}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 px-3.5 py-1.5 text-[12px] font-medium text-muted-foreground"
            >
              <p.icon className="size-3.5 text-brand-teal" aria-hidden />
              {p.text}
            </li>
          ))}
        </ul>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} KCS G-Mart. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
