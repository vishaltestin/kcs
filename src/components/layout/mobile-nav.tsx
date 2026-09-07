"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Heart, LogOut, Menu, Search, ShoppingCart, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLogout } from "@/components/auth/logout-button";
import { Logo } from "@/components/shared/logo";
import type { CategoryNode } from "@/types";

type MobileUser = { firstName: string; role: "CUSTOMER" | "ADMIN" } | null;

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

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/product?q=${encodeURIComponent(q)}`);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Open navigation menu">
          <Menu className="h-4 w-4" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left flex items-center justify-between">
            <Logo size={48} withLink={false} />
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={submitSearch} className="flex items-center gap-2 border rounded-md px-2 py-1 mt-4">
          <label htmlFor="mobile-search" className="sr-only">
            Search products
          </label>
          <input
            id="mobile-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="flex-1 bg-transparent text-sm outline-none py-1"
          />
          <button type="submit" aria-label="Search">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
          </button>
        </form>

        <nav className="mt-6" aria-label="Mobile navigation">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="home">
              <Link href="/" onClick={() => setOpen(false)} className="font-bold py-3 block">
                Home
              </Link>
            </AccordionItem>

            <AccordionItem value="products">
              <AccordionTrigger className="font-bold text-base py-3">Products</AccordionTrigger>
              <AccordionContent>
                <Link
                  href="/product"
                  onClick={() => setOpen(false)}
                  className="block font-semibold py-1.5 hover:text-primary"
                >
                  All Products
                </Link>
                {productCategories.map((category) => (
                  <div key={category.id} className="py-1">
                    <Link
                      href={`/category/${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="font-semibold hover:text-primary"
                    >
                      {category.title}
                    </Link>
                    {category.children.length > 0 && (
                      <div className="pl-4 mt-1 space-y-1">
                        {category.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            onClick={() => setOpen(false)}
                            className="block text-sm text-muted-foreground hover:text-primary"
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {specialCategories.length > 0 && (
              <AccordionItem value="special">
                <AccordionTrigger className="font-bold text-base py-3">
                  Special Category
                </AccordionTrigger>
                <AccordionContent>
                  {specialCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => setOpen(false)}
                      className="block py-1.5 text-sm hover:text-primary"
                    >
                      {category.title}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}

            {[
              { title: "About Us", href: "/about-us" },
              { title: "Why Us", href: "/why-us" },
              { title: "Blog", href: "/blog" },
              { title: "Contact Us", href: "/contact-us" },
              { title: "Wishlist", href: "/wishlist" },
              { title: "Cart", href: "/cart" },
            ].map((link) => (
              <AccordionItem key={link.href} value={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-bold py-3 block hover:text-primary"
                >
                  {link.title}
                </Link>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>

        <div className="mt-6 space-y-2 border-t pt-4">
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2 text-sm font-medium hover:text-primary"
              >
                <User className="h-4 w-4" aria-hidden /> Hello, {user.firstName}
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-primary"
                >
                  Admin Dashboard
                </Link>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  void logout("/");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden /> Logout
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link href="/signup" onClick={() => setOpen(false)}>
                Sign in / Register
              </Link>
            </Button>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Heart className="h-4 w-4" aria-hidden /> Wishlist
            </Link>
            <Link
              href="/cart"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden /> Cart
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
