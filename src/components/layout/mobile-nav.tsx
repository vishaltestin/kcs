"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronRight,
  Gift,
  Heart,
  LayoutDashboard,
  Leaf,
  Laptop,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Package,
  Phone,
  Repeat,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserCircle,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLogout } from "@/components/auth/logout-button";
import { Logo } from "@/components/shared/logo";
import { IMAGES, SITE } from "@/lib/constants";
import type { CategoryNode } from "@/types";

type MobileUser = { firstName: string; role: "CUSTOMER" | "ADMIN" } | null;

const COMPANY_LINKS = [
  { title: "About Us", href: "/about-us", icon: Users },
  { title: "Why KCS", href: "/why-us", icon: ShieldCheck },
  { title: "Gifting Blog", href: "/blog", icon: Sparkles },
  { title: "FAQ", href: "/faq", icon: ShieldCheck },
];

const OCCASION_SLUGS = ["diwali-gift-hampers", "curated-gift-hampers", "combo-gift-sets", "chocolates-dry-fruits"];

const PROGRAMME_ICONS = [Building2, Users, Laptop, Repeat, Leaf, Gift];

export function MobileNav({
  productCategories,
  specialCategories,
  user,
  onBook,
}: {
  productCategories: CategoryNode[];
  specialCategories: CategoryNode[];
  user: MobileUser;
  onBook?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const logout = useLogout();

  const close = () => setOpen(false);

  const occasions = useMemo(() => {
    const all = [...specialCategories, ...productCategories];
    return OCCASION_SLUGS.map((slug) => all.find((c) => c.slug === slug)).filter(
      (c): c is CategoryNode => Boolean(c)
    );
  }, [productCategories, specialCategories]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    close();
    router.push(`/product?q=${encodeURIComponent(q)}`);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="icon-btn" aria-label="Open navigation menu">
          <Menu className="size-5" aria-hidden />
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-[92vw] max-w-[26rem] flex-col gap-0 p-0">
        <SheetHeader className="relative flex-shrink-0 border-b px-5 py-4">
          <span aria-hidden className="brand-gradient absolute inset-x-0 top-0 h-[3px]" />
          <SheetTitle className="flex items-center justify-between text-left">
            <Logo size={60} withLink={false} />
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>

        <div className="scrollbar-thin flex-1 overflow-y-auto">
          {/* Search */}
          <div className="px-5 pt-4">
            <form
              onSubmit={submitSearch}
              role="search"
              className="flex h-12 items-center gap-2 rounded-full border border-border bg-surface pr-1.5 pl-4 transition-colors focus-within:border-brand-teal/60"
            >
              <Search className="size-4 shrink-0 text-primary" aria-hidden />
              <label htmlFor="mobile-search" className="sr-only">
                Search products
              </label>
              <input
                id="mobile-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search gifts, kits, hampers…"
                className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
              />
              <button
                type="submit"
                aria-label="Search"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-teal-strong text-white"
              >
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </form>
          </div>

          {/* Occasion tiles — the fastest route into the catalogue on a phone */}
          {occasions.length > 0 && (
            <div className="mt-5 px-5">
              <p className="eyebrow mb-3 text-muted-foreground">Shop by occasion</p>
              <div className="grid grid-cols-2 gap-2.5">
                {occasions.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    onClick={close}
                    className="relative isolate flex h-24 flex-col justify-end overflow-hidden rounded-xl bg-brand-ink p-3"
                  >
                    {category.image && (
                      <Image
                        src={category.image}
                        alt=""
                        fill
                        sizes="180px"
                        className="object-cover opacity-70"
                      />
                    )}
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/60 to-transparent"
                    />
                    <span className="relative text-[13px] leading-tight font-bold text-white">{category.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Account strip */}
          <div className="mx-5 mt-5 border-y border-foreground/[0.1] py-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="display grid size-10 place-items-center rounded-full bg-brand-ink text-[15px] text-white ring-2 ring-brand-teal/40">
                  {user.firstName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">Hello, {user.firstName}</p>
                  <Link href="/profile" onClick={close} className="text-xs font-medium text-primary">
                    View profile
                  </Link>
                </div>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={close}
                    className="grid size-9 place-items-center rounded-full border bg-background text-foreground"
                    aria-label="Admin console"
                  >
                    <LayoutDashboard className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full border border-foreground/15 text-muted-foreground">
                  <UserCircle className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Welcome</p>
                  <p className="text-xs text-muted-foreground">Sign in for faster checkout</p>
                </div>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/login" onClick={close}>
                    Sign in
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Catalogue + programmes */}
          <nav className="px-5 pt-2" aria-label="Mobile navigation">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="products" className="border-b-0">
                <AccordionTrigger className="display py-3 text-[1.05rem] hover:text-primary hover:no-underline">
                  <span className="flex items-center gap-2.5">
                    <Gift className="size-4 text-brand-teal" aria-hidden />
                    All categories
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <Link
                    href="/product"
                    onClick={close}
                    className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[13px] font-bold text-accent-foreground"
                  >
                    All products <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  <div className="space-y-3.5">
                    {productCategories.map((category) => (
                      <div key={category.id} className="min-w-0">
                        <Link
                          href={`/category/${category.slug}`}
                          onClick={close}
                          className="flex items-center gap-2.5 text-[14px] font-bold hover:text-primary"
                        >
                          <span className="studio relative size-7 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/5">
                            {category.image && (
                              <Image
                                src={category.image}
                                alt=""
                                fill
                                sizes="28px"
                                className="object-contain p-0.5 mix-blend-multiply dark:mix-blend-normal"
                              />
                            )}
                          </span>
                          {category.title}
                        </Link>
                        {category.children.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5 border-l border-border pl-3">
                            {category.children.map((child) => (
                              <Link
                                key={child.id}
                                href={`/category/${child.slug}`}
                                onClick={close}
                                className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-primary"
                              >
                                {child.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {specialCategories.length > 0 && (
                <AccordionItem value="special" className="border-b-0 border-t">
                  <AccordionTrigger className="display py-3 text-[1.05rem] hover:text-primary hover:no-underline">
                    <span className="flex items-center gap-2.5">
                      <Building2 className="size-4 text-brand-teal" aria-hidden />
                      Corporate programmes
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-1.5">
                      {specialCategories.map((category, index) => {
                        const Icon = PROGRAMME_ICONS[index % PROGRAMME_ICONS.length];
                        return (
                          <Link
                            key={category.id}
                            href={`/category/${category.slug}`}
                            onClick={close}
                            className="flex items-center gap-3 rounded-xl border border-border/70 p-2.5 transition-colors hover:border-brand-teal/40 hover:bg-accent/40"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">
                              {category.title}
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
                          </Link>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Company */}
            <div className="border-t border-b">
              {COMPANY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex items-center gap-3 border-b border-border/60 py-3 text-[14px] font-semibold last:border-b-0 hover:text-primary"
                >
                  <link.icon className="size-4 text-brand-teal" aria-hidden />
                  {link.title}
                  <ChevronRight className="ml-auto size-4 text-muted-foreground/50" aria-hidden />
                </Link>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/wishlist"
                onClick={close}
                className="flex items-center gap-2 rounded-xl border border-foreground/15 p-3 text-[13px] font-semibold transition-colors hover:border-brand-teal hover:text-primary"
              >
                <Heart className="size-4 text-brand-magenta" aria-hidden /> Wishlist
              </Link>
              <Link
                href="/cart"
                onClick={close}
                className="flex items-center gap-2 rounded-xl border border-foreground/15 p-3 text-[13px] font-semibold transition-colors hover:border-brand-teal hover:text-primary"
              >
                <ShoppingBag className="size-4 text-brand-magenta" aria-hidden /> Cart
              </Link>
              <Link
                href="/profile?tab=orders"
                onClick={close}
                className="flex items-center gap-2 rounded-xl border border-foreground/15 p-3 text-[13px] font-semibold transition-colors hover:border-brand-teal hover:text-primary"
              >
                <Package className="size-4 text-brand-magenta" aria-hidden /> Track order
              </Link>
              <Link
                href="/contact-us"
                onClick={close}
                className="flex items-center gap-2 rounded-xl border border-foreground/15 p-3 text-[13px] font-semibold transition-colors hover:border-brand-teal hover:text-primary"
              >
                <Phone className="size-4 text-brand-magenta" aria-hidden /> Bulk enquiry
              </Link>
            </div>

            {/* Contact card */}
            <div className="relative isolate mt-6 overflow-hidden rounded-2xl bg-brand-ink p-5 text-white">
              <Image src={IMAGES.homeGrid.corporate} alt="" fill sizes="360px" className="object-cover opacity-20" />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-brand-ink/90 to-brand-ink/70" />
              <div className="relative">
                <span className="kicker text-brand-teal-light">Need it customised?</span>
                <p className="display mt-2 text-[1.1rem] text-white">Tell us the brief, we will quote today.</p>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    onBook?.();
                  }}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-secondary text-[13px] font-bold text-secondary-foreground transition-colors hover:bg-brand-magenta-strong"
                >
                  <CalendarDays className="size-4" aria-hidden /> Book a Meeting
                </button>
                <div className="mt-3 flex flex-col gap-1.5 text-[12.5px] text-white/70">
                  <a href={SITE.phoneHref} className="flex items-center gap-2 hover:text-white">
                    <Phone className="size-3.5 text-brand-teal-light" aria-hidden /> {SITE.phone}
                  </a>
                  <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-white">
                    <Mail className="size-3.5 text-brand-teal-light" aria-hidden /> {SITE.email}
                  </a>
                  <span className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-teal-light" aria-hidden /> {SITE.address}
                  </span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        <div className="relative flex-shrink-0 border-t bg-surface px-5 py-4">
          <span aria-hidden className="brand-gradient absolute inset-x-0 top-0 h-px opacity-70" />
          {user ? (
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                close();
                void logout("/");
              }}
            >
              <LogOut aria-hidden /> Sign out
            </Button>
          ) : (
            <Button asChild className="w-full rounded-full">
              <Link href="/signup" onClick={close}>
                Create an account
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
