"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  Search,
  ShoppingBag,
  UserCircle,
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
import { SITE } from "@/lib/constants";
import type { CategoryNode } from "@/types";

type MobileUser = { firstName: string; role: "CUSTOMER" | "ADMIN" } | null;

const PAGES = [
  { title: "About Us", href: "/about-us" },
  { title: "Why Us", href: "/why-us" },
  { title: "Blog", href: "/blog" },
  { title: "Contact Us", href: "/contact-us" },
];

export function MobileNav({
  productCategories,
  specialCategories,
  user,
}: {
  productCategories: CategoryNode[];
  specialCategories: CategoryNode[];
  user: MobileUser;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const logout = useLogout();

  const close = () => setOpen(false);

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
        <button
          type="button"
          className="grid size-10 place-items-center rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[88vw] max-w-sm flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="flex-shrink-0 border-b px-5 py-4">
          <SheetTitle className="flex items-center justify-between text-left">
            <Logo size={56} withLink={false} />
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
          <form
            onSubmit={submitSearch}
            role="search"
            className="flex h-11 items-center gap-2 rounded-xl border-2 border-brand-deep/70 bg-background pr-1 pl-3"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <label htmlFor="mobile-search" className="sr-only">
              Search products
            </label>
            <input
              id="mobile-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="grid size-8 place-items-center rounded-lg bg-brand-deep text-white"
            >
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </form>

          {/* Account strip */}
          <div className="mt-4 rounded-2xl bg-surface p-3 ring-1 ring-foreground/[0.05]">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
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
                    className="grid size-9 place-items-center rounded-lg border bg-background text-foreground"
                    aria-label="Admin console"
                  >
                    <LayoutDashboard className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10">
                  <UserCircle className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Welcome</p>
                  <p className="text-xs text-muted-foreground">Sign in for faster checkout</p>
                </div>
                <Button asChild size="sm">
                  <Link href="/login" onClick={close}>
                    Sign in
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <nav className="mt-5" aria-label="Mobile navigation">
            <Link
              href="/"
              onClick={close}
              className="flex items-center justify-between py-3 text-[15px] font-bold"
            >
              Home <ChevronRight className="size-4 text-muted-foreground/60" aria-hidden />
            </Link>

            <Accordion type="multiple" className="w-full border-t">
              <AccordionItem value="products">
                <AccordionTrigger className="py-3 text-[15px] font-bold hover:no-underline">Products</AccordionTrigger>
                <AccordionContent className="pb-3">
                  <Link
                    href="/product"
                    onClick={close}
                    className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    All products <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  <div className="space-y-3">
                    {productCategories.map((category) => (
                      <div key={category.id}>
                        <Link
                          href={`/category/${category.slug}`}
                          onClick={close}
                          className="text-[14px] font-semibold hover:text-primary"
                        >
                          {category.title}
                        </Link>
                        {category.children.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {category.children.map((child) => (
                              <Link
                                key={child.id}
                                href={`/category/${child.slug}`}
                                onClick={close}
                                className="rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
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
                <AccordionItem value="special">
                  <AccordionTrigger className="py-3 text-[15px] font-bold hover:no-underline">
                    Special Category
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-1">
                      {specialCategories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/category/${category.slug}`}
                          onClick={close}
                          className="flex items-center justify-between rounded-lg py-2 text-[14px] font-medium hover:text-primary"
                        >
                          {category.title}
                          <ChevronRight className="size-4 text-muted-foreground/50" aria-hidden />
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            <div className="border-t">
              {PAGES.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="flex items-center justify-between border-b py-3 text-[15px] font-bold last:border-b-0 hover:text-primary"
                >
                  {link.title}
                  <ChevronRight className="size-4 text-muted-foreground/60" aria-hidden />
                </Link>
              ))}
            </div>
          </nav>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/wishlist"
              onClick={close}
              className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Heart className="size-4" aria-hidden /> Wishlist
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ShoppingBag className="size-4" aria-hidden /> Cart
            </Link>
          </div>
        </div>

        <div className="flex-shrink-0 space-y-2 border-t bg-surface px-5 py-4">
          <a
            href={SITE.phoneHref}
            className="flex items-center gap-3 rounded-xl bg-background p-3 ring-1 ring-foreground/[0.06]"
          >
            <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
              <Phone className="size-4" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] text-muted-foreground">Call us now</span>
              <span className="block text-sm font-bold">{SITE.phone}</span>
            </span>
          </a>
          {user ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                close();
                void logout("/");
              }}
            >
              <LogOut aria-hidden /> Sign out
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
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
