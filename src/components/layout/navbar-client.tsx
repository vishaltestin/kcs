"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Gift,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCircle,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useLogout } from "@/components/auth/logout-button";
import { searchSuggestionsAction } from "@/actions/search";
import { Logo } from "@/components/shared/logo";
import { MobileNav } from "./mobile-nav";
import { CartSidebar } from "./cart-sidebar";
import { BookMeetingDialog } from "@/components/book-a-meeting/book-meeting-dialog";
import { IMAGES, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/types";

type SearchSuggestion = {
  id: string;
  name: string;
  slug: string;
  image: string;
  brand: string;
  category: string;
};

type NavbarUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
} | null;

const STATIC_LINKS = [
  { title: "About Us", href: "/about-us" },
  { title: "Why Us", href: "/why-us" },
  { title: "Blog", href: "/blog" },
  { title: "Contact Us", href: "/contact-us" },
];

const QUICK_SEARCHES = ["Diwali hampers", "Joining kits", "Drinkware", "Tech gadgets", "T-shirts"];

export function NavbarClient({
  productCategories,
  specialCategories,
  user,
}: {
  productCategories: CategoryNode[];
  specialCategories: CategoryNode[];
  user: NavbarUser;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const [scrolled, setScrolled] = useState(false);
  const logout = useLogout();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced suggestions from the server action
  useEffect(() => {
    const query = searchQuery.trim();
    let cancelled = false;

    // All state changes happen asynchronously (inside timers / after await),
    // never synchronously in the effect body.
    const timer = setTimeout(
      async () => {
        if (query.length < 2) {
          setSuggestions([]);
          setIsSearching(false);
          return;
        }
        setIsSearching(true);
        try {
          const results = await searchSuggestionsAction(query);
          if (cancelled) return;
          setSuggestions(results);
          setShowSuggestions(true);
        } finally {
          if (!cancelled) setIsSearching(false);
        }
      },
      query.length < 2 ? 0 : 300
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Shadow under the sticky nav row once the page has scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 140);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" focuses search (unless already typing somewhere)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") setShowSuggestions(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setShowSuggestions(false);
    router.push(`/product?q=${encodeURIComponent(query)}`);
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setSearchQuery("");
    router.push(`/product/${slug}`);
  };

  const handleLogout = () => {
    // useLogout clears account-scoped client state (wishlist/cart) so a
    // shared browser never shows one user's data to the next user.
    startLogoutTransition(async () => {
      await logout("/");
    });
  };

  const showPanel = showSuggestions && (searchQuery.trim().length >= 2 || searchQuery.trim().length === 0);

  return (
    <nav className="w-full bg-background" aria-label="Main navigation">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="w-full bg-brand-ink text-white/80">
        <div className="flex h-10 items-center justify-between px-4 md:px-10 xl:px-20">
          <div className="hidden items-center gap-5 md:flex">
            <Link href="/product" className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-white">
              <Truck className="size-3.5 text-brand-amber" aria-hidden />
              Free standard shipping over ₹1,000
            </Link>
            <span className="h-3 w-px bg-white/15" aria-hidden />
            <Link href="/category/curated-gift-hampers" className="flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-white">
              <Gift className="size-3.5 text-brand-amber" aria-hidden />
              100% customised hampers
            </Link>
            <span className="hidden h-3 w-px bg-white/15 lg:block" aria-hidden />
            <span className="hidden items-center gap-1.5 text-[12px] font-medium lg:flex">
              <ShieldCheck className="size-3.5 text-brand-amber" aria-hidden />
              GST invoice on every order
            </span>
          </div>

          {/* Mobile ticker */}
          <div className="marquee flex-1 md:hidden" aria-hidden>
            <span className="marquee-inner text-[11px] font-medium">
              <span>Free standard shipping over ₹1,000</span>
              <span>·</span>
              <span>100% customised hampers</span>
              <span>·</span>
              <span>GST invoice on every order</span>
              <span>·</span>
              <span>Pan-India delivery</span>
              <span>·</span>
              <span>Free standard shipping over ₹1,000</span>
              <span>·</span>
              <span>100% customised hampers</span>
              <span>·</span>
              <span>GST invoice on every order</span>
              <span>·</span>
              <span>Pan-India delivery</span>
              <span>·</span>
            </span>
          </div>

          <div className="flex h-full items-center gap-5">
            <ul className="hidden items-center gap-5 text-[12px] font-medium lg:flex">
              <li>
                <Link href="/product" className="transition-colors hover:text-white">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <a href={SITE.phoneHref} className="flex items-center gap-1.5 transition-colors hover:text-white">
                  <Phone className="size-3.5" aria-hidden /> {SITE.phone}
                </a>
              </li>
              {user ? (
                <li>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full py-1 pr-1 pl-1 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
                        aria-label="Account menu"
                      >
                        <Avatar className="size-6">
                          <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="max-w-24 truncate text-white">{user.firstName}</span>
                        <ChevronDown className="size-3.5 text-white/60" aria-hidden />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
                      <DropdownMenuLabel className="px-2.5 py-2 font-normal">
                        <p className="text-sm font-semibold leading-none">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link href="/profile">
                          <UserCircle className="mr-2 size-4" aria-hidden /> My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link href="/profile?tab=orders">
                          <Package className="mr-2 size-4" aria-hidden /> My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link href="/wishlist">
                          <Heart className="mr-2 size-4" aria-hidden /> Gifting Ideas
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "ADMIN" && (
                        <DropdownMenuItem asChild className="rounded-lg">
                          <Link href="/admin">
                            <LayoutDashboard className="mr-2 size-4" aria-hidden /> Admin Console
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="rounded-lg text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 size-4" aria-hidden />
                        {isLoggingOut ? "Signing out…" : "Sign out"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ) : (
                <li className="flex items-center gap-1.5">
                  <Link href="/login" className="transition-colors hover:text-white">
                    Sign in
                  </Link>
                  <span className="text-white/30" aria-hidden>
                    /
                  </span>
                  <Link href="/signup" className="font-semibold text-white transition-colors hover:text-brand-amber">
                    Register
                  </Link>
                </li>
              )}
            </ul>
            <Link
              href="/contact-us"
              className="flex h-10 items-center gap-1.5 bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--primary),black_10%)] md:px-5"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mobile brand row ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-3 md:hidden">
        <Logo size={64} />
        <div className="flex items-center gap-2">
          <Link
            href="/wishlist"
            className="grid size-10 place-items-center rounded-full border border-border bg-background text-foreground"
            aria-label="Wishlist"
          >
            <Heart className="size-[18px]" aria-hidden />
          </Link>
          <CartSidebar compact />
          <MobileNav
            productCategories={productCategories}
            specialCategories={specialCategories}
            user={user}
          />
        </div>
      </div>

      {/* ── Logo / search / actions ─────────────────────────────────────── */}
      <div className="flex w-full items-center justify-between gap-4 px-4 py-3 md:px-10 md:py-4 xl:px-20">
        <div className="hidden md:block">
          <Logo size={96} />
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative flex flex-1 items-center md:max-w-2xl">
          <form
            onSubmit={handleSearch}
            role="search"
            className={cn(
              "search-bar flex h-12 w-full items-center gap-1 rounded-xl border-2 border-brand-deep/80 bg-background pr-1.5 pl-4 transition-all duration-200",
              showPanel && "rounded-b-none border-b-transparent"
            )}
          >
            <Search className="size-[18px] shrink-0 text-muted-foreground" aria-hidden />
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              ref={inputRef}
              id="site-search"
              type="search"
              role="combobox"
              autoComplete="off"
              placeholder="Search products, brands, categories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[15px] outline-none placeholder:text-muted-foreground/80 md:text-sm [&::-webkit-search-cancel-button]:hidden"
              aria-autocomplete="list"
              aria-expanded={showPanel}
              aria-controls="site-search-panel"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  inputRef.current?.focus();
                }}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
            <kbd className="mr-1 hidden h-6 items-center rounded-md border border-border bg-muted px-1.5 font-sans text-[11px] font-semibold text-muted-foreground md:inline-flex">
              /
            </kbd>
            <button
              type="submit"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand-deep px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary"
              aria-label="Search"
            >
              {isSearching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          {/* Suggestions panel */}
          {showPanel && (
            <div
              id="site-search-panel"
              className="absolute top-full right-0 left-0 z-50 max-h-[26rem] overflow-y-auto rounded-b-xl border-2 border-t-0 border-brand-deep/80 bg-background shadow-[0_28px_56px_-20px_rgb(0_0_0/0.35)]"
            >
              {searchQuery.trim().length < 2 ? (
                <div className="p-4">
                  <p className="eyebrow mb-3 text-muted-foreground">Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_SEARCHES.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setShowSuggestions(false);
                          router.push(`/product?q=${encodeURIComponent(term)}`);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[13px] font-medium transition-colors hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
                      >
                        <Sparkles className="size-3.5 text-primary" aria-hidden />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3" role="listbox" aria-label="Search suggestions">
                  <div className="mb-2 flex items-center justify-between px-2 pt-1">
                    <h3 className="eyebrow text-muted-foreground">
                      Products {suggestions.length > 0 && `· ${suggestions.length}`}
                    </h3>
                    <span className="text-[11px] text-muted-foreground">Enter ↵ for all results</span>
                  </div>

                  {suggestions.length === 0 && !isSearching ? (
                    <div className="px-2 py-6 text-center">
                      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted">
                        <Search className="size-5 text-muted-foreground" aria-hidden />
                      </span>
                      <h4 className="text-sm font-semibold">No matches for &quot;{searchQuery}&quot;</h4>
                      <p className="mt-1 text-xs text-muted-foreground">Try a broader term or browse categories.</p>
                      <button
                        onClick={() => handleSearch()}
                        className="mt-3 text-sm font-semibold text-primary hover:underline"
                      >
                        Search the full catalogue
                      </button>
                    </div>
                  ) : (
                    <ul className="grid gap-0.5">
                      {suggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => handleSuggestionClick(product.slug)}
                            className="group/sugg flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted"
                          >
                            <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
                              <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold transition-colors group-hover/sugg:text-primary">
                                {product.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {product.brand} · {product.category}
                              </span>
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover/sugg:translate-x-0.5 group-hover/sugg:text-primary" aria-hidden />
                          </button>
                        </li>
                      ))}
                      <li className="mt-1 border-t pt-1">
                        <button
                          onClick={() => handleSearch()}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/[0.06]"
                        >
                          See all results for &quot;{searchQuery}&quot;
                          <ArrowRight className="size-4" aria-hidden />
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Phone / wishlist / cart */}
        <div className="hidden h-full items-center gap-2 lg:flex">
          <a
            href={SITE.phoneHref}
            className="group/phone mr-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-muted"
          >
            <span className="grid size-10 place-items-center rounded-full bg-primary/[0.08] text-primary transition-colors group-hover/phone:bg-primary group-hover/phone:text-primary-foreground">
              <Phone className="size-[18px]" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <small className="text-[11px] font-medium text-muted-foreground">Call us now</small>
              <span className="text-[14px] font-bold tracking-tight">(+91) 78 3815 2753</span>
            </span>
          </a>
          <Link
            href="/wishlist"
            className="group/wish flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors hover:bg-muted"
          >
            <span className="grid size-10 place-items-center rounded-full border border-border bg-background text-foreground transition-colors group-hover/wish:border-primary/40 group-hover/wish:text-primary">
              <Heart className="size-[18px]" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <small className="text-[11px] font-medium text-muted-foreground">Gifting ideas</small>
              <span className="text-[14px] font-bold tracking-tight">Wishlist</span>
            </span>
          </Link>
          <CartSidebar />
        </div>

        <div className="hidden items-center gap-2 md:flex lg:hidden">
          <CartSidebar compact />
          <MobileNav
            productCategories={productCategories}
            specialCategories={specialCategories}
            user={user}
          />
        </div>
      </div>

      {/* ── Main nav row (sticky) ───────────────────────────────────────── */}
      <div
        className={cn(
          "sticky top-0 z-40 hidden w-full border-y border-border/70 bg-background/90 backdrop-blur-md transition-shadow duration-300 lg:block",
          scrolled && "shadow-[0_12px_28px_-18px_rgb(0_0_0/0.35)]"
        )}
      >
        <div className="flex h-14 items-center justify-between px-5 xl:px-20">
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="flex gap-7">
              <NavigationMenuItem>
                <Link
                  href="/"
                  data-active={pathname === "/"}
                  className={cn("underline-animation text-[14px] font-bold", pathname === "/" && "text-primary")}
                >
                  Home
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-auto rounded-none bg-transparent p-0 text-[14px] font-bold hover:bg-transparent hover:text-primary focus:bg-transparent data-open:bg-transparent data-open:text-primary data-popup-open:bg-transparent data-open:hover:bg-transparent data-open:focus:bg-transparent data-popup-open:hover:bg-transparent">
                  <Link
                    href="/product"
                    className={cn(pathname.startsWith("/product") && "text-primary")}
                  >
                    Products
                  </Link>
                </NavigationMenuTrigger>
                <NavigationMenuContent className="group-data-[viewport=false]/navigation-menu:mt-3 group-data-[viewport=false]/navigation-menu:rounded-2xl group-data-[viewport=false]/navigation-menu:bg-background group-data-[viewport=false]/navigation-menu:shadow-[0_32px_64px_-24px_rgb(0_0_0/0.35)] group-data-[viewport=false]/navigation-menu:ring-border/80 p-0">
                  <MegaMenuPanel categories={productCategories} />
                </NavigationMenuContent>
              </NavigationMenuItem>

              {specialCategories.length > 0 && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-auto rounded-none bg-transparent p-0 text-[14px] font-bold hover:bg-transparent hover:text-primary focus:bg-transparent data-open:bg-transparent data-open:text-primary data-popup-open:bg-transparent data-open:hover:bg-transparent data-open:focus:bg-transparent data-popup-open:hover:bg-transparent">
                    Special Category
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="group-data-[viewport=false]/navigation-menu:mt-3 group-data-[viewport=false]/navigation-menu:rounded-2xl group-data-[viewport=false]/navigation-menu:bg-background group-data-[viewport=false]/navigation-menu:shadow-[0_32px_64px_-24px_rgb(0_0_0/0.35)] group-data-[viewport=false]/navigation-menu:ring-border/80 p-0">
                    <SpecialMenuPanel categories={specialCategories} />
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}

              {STATIC_LINKS.map((link) => (
                <NavigationMenuItem key={link.href}>
                  <Link
                    href={link.href}
                    data-active={pathname === link.href}
                    className={cn(
                      "underline-animation text-[14px] font-bold",
                      pathname === link.href && "text-primary"
                    )}
                  >
                    {link.title}
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="ml-4 flex items-center gap-5">
            <Link href="/contact-us" className="underline-animation text-[14px] font-bold">
              Quick Quotation
            </Link>
            <Button onClick={() => setBookingOpen(true)} className="h-10 rounded-lg px-5">
              <CalendarDays aria-hidden /> Book a Meeting
            </Button>
          </div>
        </div>
      </div>

      <BookMeetingDialog open={bookingOpen} onOpenChange={setBookingOpen} />

      {/* Banner strip image (mobile brand reinforcement, hidden on desktop) */}
      <div className="px-4 pb-2 md:hidden">
        <Link href="/product" className="relative block h-24 overflow-hidden rounded-xl">
          <Image
            src={IMAGES.homeBanners[0]}
            alt="KCS G-Mart corporate gifting"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </Link>
      </div>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mega menus                                                                 */
/* -------------------------------------------------------------------------- */

function MegaMenuPanel({ categories }: { categories: CategoryNode[] }) {
  const withChildren = categories.filter((c) => c.children.length > 0);
  const leaves = categories.filter((c) => c.children.length === 0);

  return (
    <div className="flex w-[min(92vw,1040px)]">
      <div className="min-w-0 flex-1 p-7">
        <div className="mb-5 flex items-center justify-between">
          <p className="eyebrow text-muted-foreground">Browse by category</p>
          <Link href="/product" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
            All products <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-x-8 gap-y-6">
          {withChildren.map((category) => (
            <div key={category.id} className="min-w-0">
              <Link
                href={`/category/${category.slug}`}
                className="group/cat mb-2 flex items-start gap-1 text-[13.5px] leading-snug font-bold tracking-tight transition-colors hover:text-primary"
              >
                <span>{category.title}</span>
                <ChevronRight className="mt-0.5 size-3.5 shrink-0 -translate-x-1 opacity-0 transition-all group-hover/cat:translate-x-0 group-hover/cat:opacity-100" aria-hidden />
              </Link>
              <ul className="space-y-1">
                {category.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/category/${child.slug}`}
                      className="block truncate text-[13px] text-muted-foreground transition-colors hover:text-primary"
                    >
                      {child.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {leaves.length > 0 && (
            <div className="col-span-4 border-t pt-5">
              <div className="flex flex-wrap gap-2">
                {leaves.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="rounded-full border border-border px-3 py-1.5 text-[12.5px] font-semibold transition-colors hover:border-primary/40 hover:bg-primary/[0.06] hover:text-primary"
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature tile */}
      <Link
        href="/category/curated-gift-hampers"
        className="group/feature relative hidden w-[17rem] shrink-0 overflow-hidden rounded-r-2xl bg-brand-charcoal xl:block"
      >
        <Image
          src={IMAGES.homeGrid.diwali}
          alt=""
          fill
          sizes="272px"
          className="object-cover opacity-80 transition-transform duration-700 group-hover/feature:scale-105"
        />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <span className="absolute inset-x-0 bottom-0 p-6 text-white">
          <span className="eyebrow text-brand-amber">Festive season</span>
          <span className="mt-2 block text-lg font-extrabold leading-tight">Curated Diwali &amp; festive hampers</span>
          <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold">
            Shop the edit <ArrowRight className="size-3.5 transition-transform group-hover/feature:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </Link>
    </div>
  );
}

function SpecialMenuPanel({ categories }: { categories: CategoryNode[] }) {
  return (
    <div className="w-[min(92vw,720px)] p-6">
      <p className="eyebrow mb-4 text-muted-foreground">Special programmes</p>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className="group/sp flex items-center gap-3 rounded-xl border border-transparent p-3 transition-all hover:border-border hover:bg-surface"
          >
            <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/5">
              {category.image ? (
                <Image src={category.image} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <span className="grid size-full place-items-center text-primary">
                  <Gift className="size-5" aria-hidden />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold tracking-tight transition-colors group-hover/sp:text-primary">
                {category.title}
              </span>
              {category.children.length > 0 && (
                <span className="block truncate text-xs text-muted-foreground">
                  {category.children.map((c) => c.title).join(" · ")}
                </span>
              )}
            </span>
            <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover/sp:translate-x-0.5 group-hover/sp:text-primary" aria-hidden />
          </Link>
        ))}
      </div>
    </div>
  );
}
