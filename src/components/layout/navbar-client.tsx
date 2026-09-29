"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Gift,
  Heart,
  History,
  LayoutDashboard,
  Leaf,
  Laptop,
  Loader2,
  LogOut,
  Package,
  Percent,
  Phone,
  Repeat,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { LogoMark } from "@/components/shared/logo";
import { MobileNav } from "./mobile-nav";
import { CartSidebar } from "./cart-sidebar";
import { BookMeetingDialog } from "@/components/book-a-meeting/book-meeting-dialog";
import { IMAGES, SITE } from "@/lib/constants";
import { cn, formatCurrency } from "@/lib/utils";
import type { CategoryNode } from "@/types";
import type { SearchSuggestions } from "@/lib/queries/catalog";

type SearchSuggestion = SearchSuggestions;
const EMPTY_SUGGESTIONS: SearchSuggestions = { products: [], categories: [], brands: [] };

type NavbarUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "VENDOR";
} | null;

/** Shared chrome for every mega panel — gradient rule + rounded shell. */

const COMPANY_LINKS = [
  { title: "About Us", href: "/about-us", icon: Users, blurb: "Who we are and how we work" },
  { title: "Why KCS", href: "/why-us", icon: ShieldCheck, blurb: "Quality, timelines, pricing" },
  { title: "Gifting Blog", href: "/blog", icon: Sparkles, blurb: "Ideas, trends and playbooks" },
  { title: "FAQ", href: "/faq", icon: Percent, blurb: "MOQ, GST, shipping, branding" },
];

/** One-liners for the programme cards, keyed by category slug. */
const PROGRAMME_COPY: Record<string, string> = {
  "corporate-gifting": "Employee and client gifting, end to end",
  "onboarding-joining-kits": "Kitted, branded, ready for day one",
  "work-from-home": "Home-office setups for distributed teams",
  "trade-schemes": "Dealer, channel and loyalty rewards",
  "sustainable-gifts": "Recycled, reusable, plastic-light",
  "diwali-gift-hampers": "Festive hampers that land on time",
};

const OCCASION_SLUGS = [
  "curated-gift-hampers",
  "combo-gift-sets",
  "chocolates-dry-fruits",
  "personal-lifestyle",
  "office-stationery",
];

const QUICK_SEARCHES = ["Diwali hampers", "Joining kits", "Drinkware", "Tech gadgets", "T-shirts"];

const PANEL_FOOTER = [
  { label: "Bulk enquiry", href: "/contact-us", icon: Phone },
  { label: "Track an order", href: "/profile?tab=orders", icon: Package },
  { label: "Delivery & returns", href: "/faq", icon: Truck },
  { label: "All products", href: "/product", icon: Gift },
];

export function NavbarClient({
  productCategories,
  specialCategories,
  user,
  freeShippingThreshold = 0,
}: {
  productCategories: CategoryNode[];
  specialCategories: CategoryNode[];
  user: NavbarUser;
  /** From store settings; 0 hides the free-shipping promise. */
  freeShippingThreshold?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const shippingPromise =
    freeShippingThreshold > 0
      ? `Free standard shipping over ₹${freeShippingThreshold.toLocaleString("en-IN")}`
      : "Zone-wise shipping, calculated at checkout";

  const [searchQuery, setSearchQuery] = useState("");
  // The overlay remembers which route it was opened on: any navigation changes
  // `pathname`, so the overlay closes itself without an effect.
  const [searchOpenedAt, setSearchOpenedAt] = useState<string | null>(null);
  const searchOpen = searchOpenedAt === pathname;
  const [suggestions, setSuggestions] = useState<SearchSuggestion>(EMPTY_SUGGESTIONS);
  const [recent, setRecent] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isLoggingOut, startLogoutTransition] = useTransition();
  const [scrolled, setScrolled] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logout = useLogout();

  const bySlug = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    for (const c of [...productCategories, ...specialCategories]) map.set(c.slug, c);
    return map;
  }, [productCategories, specialCategories]);

  /** Occasion tiles — real categories only, in a deliberate order. */
  const occasions = useMemo(() => {
    const picked = ["diwali-gift-hampers", ...OCCASION_SLUGS]
      .map((slug) => bySlug.get(slug))
      .filter((c): c is CategoryNode => Boolean(c));
    const promos: { title: string; copy: string; href: string; image: string }[] = [
      {
        title: "Gourmet hampers",
        copy: "Cheese, coffee, chocolates — boxed",
        href: "/category/gourmet-hampers",
        image: IMAGES.homeGrid.gourmet,
      },
      {
        title: "Festive, corporate-ready",
        copy: "Diwali, New Year and milestone gifting",
        href: "/category/corporate-gifting",
        image: IMAGES.homeGrid.corporate,
      },
    ];
    return { picked, promos };
  }, [bySlug]);

  const programmes = useMemo(
    () =>
      specialCategories
        .filter((c) => c.slug !== "diwali-gift-hampers")
        .map((c) => ({ ...c, copy: PROGRAMME_COPY[c.slug] ?? "Programme gifting, handled end to end" })),
    [specialCategories]
  );

  /** Recents live in localStorage; read them when the overlay opens. */
  const syncRecent = () => {
    try {
      const raw = window.localStorage.getItem("kcs:recent-searches");
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      setRecent(
        Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string").slice(0, 5) : []
      );
    } catch {
      setRecent([]);
    }
  };

  // ⏤ Search: debounced server suggestions, only while the overlay is open ⏤
  useEffect(() => {
    const query = searchQuery.trim();
    let cancelled = false;

    const timer = setTimeout(
      async () => {
        if (!searchOpen || query.length < 2) {
          setSuggestions(EMPTY_SUGGESTIONS);
          setIsSearching(false);
          return;
        }
        setIsSearching(true);
        try {
          const results = await searchSuggestionsAction(query);
          if (cancelled) return;
          setSuggestions(results);
        } finally {
          if (!cancelled) setIsSearching(false);
        }
      },
      query.length < 2 ? 0 : 280
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchOpen]);

  // Sticky behaviour: the rail is always pinned; past ~280px it just condenses
  // (hairline + shadow) so it stops competing with the content underneath.
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      setScrolled(window.scrollY > 280);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "/" opens the search overlay, Esc closes it, outside click dismisses it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        syncRecent();
        setSearchOpenedAt(window.location.pathname);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (e.key === "Escape") {
        setSearchOpenedAt(null);
        setSearchQuery("");
      }
    };
    const onClick = (event: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target as Node)) {
        setSearchOpenedAt(null);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) requestAnimationFrame(() => inputRef.current?.focus());
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpenedAt(null);
    setSearchQuery("");
  };

  const openSearch = () => {
    syncRecent();
    setSearchOpenedAt(pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    closeSearch();
    try {
      const next = [query, ...recent.filter((r) => r !== query)].slice(0, 5);
      window.localStorage.setItem("kcs:recent-searches", JSON.stringify(next));
    } catch {
      /* private mode — recents are a nicety, never a blocker */
    }
    router.push(`/product?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = () => {
    startLogoutTransition(async () => {
      await logout("/");
    });
  };

  const suggestionTotal =
    suggestions.products.length + suggestions.categories.length + suggestions.brands.length;

  return (
    // `contents` keeps sticky children working against the viewport.
    <nav className="contents" aria-label="Main navigation">
      {/* ══ Announcement strip — scrolls away, keeps the promises ══════════ */}
      <div className="relative w-full bg-brand-ink text-white/70">
        <span aria-hidden className="brand-gradient absolute inset-x-0 bottom-0 h-px opacity-70" />
        <div className="container flex h-10 items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4 lg:gap-6">
            <Link
              href="/product"
              className="flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap transition-colors hover:text-brand-teal-light"
            >
              <Truck className="size-3.5 text-brand-magenta-light" aria-hidden />
              <span className="hidden sm:inline">{shippingPromise}</span>
              <span className="sm:hidden">Free shipping</span>
            </Link>
            <span aria-hidden className="hidden h-3 w-px bg-white/15 lg:block" />
            <Link
              href="/category/curated-gift-hampers"
              className="hidden items-center gap-1.5 text-[12px] font-medium whitespace-nowrap transition-colors hover:text-brand-teal-light lg:flex"
            >
              <Gift className="size-3.5 text-brand-magenta-light" aria-hidden />
              100% customised hampers
            </Link>
            <span aria-hidden className="hidden h-3 w-px bg-white/15 xl:block" />
            <span className="hidden items-center gap-1.5 text-[12px] font-medium whitespace-nowrap xl:flex">
              <ShieldCheck className="size-3.5 text-brand-magenta-light" aria-hidden />
              GST invoice on every order
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4 text-[12px] font-medium">
            <Link
              href="/contact-us"
              className="hidden items-center gap-1.5 whitespace-nowrap transition-colors hover:text-brand-teal-light sm:flex"
            >
              <span className="relative flex size-1.5">
                <span aria-hidden className="absolute inline-flex size-full animate-ping rounded-full bg-brand-teal-light opacity-75" />
                <span aria-hidden className="relative inline-flex size-1.5 rounded-full bg-brand-teal-light" />
              </span>
              Talk to a gifting expert
            </Link>
            <a
              href={SITE.phoneHref}
              className="hidden items-center gap-1.5 whitespace-nowrap transition-colors hover:text-brand-teal-light md:flex"
            >
              <Phone className="size-3.5" aria-hidden /> {SITE.phone}
            </a>
            {!user && (
              <span className="hidden items-center gap-1.5 lg:flex">
                <Link href="/login" className="transition-colors hover:text-brand-teal-light">
                  Sign in
                </Link>
                <span className="text-white/25" aria-hidden>
                  /
                </span>
                <Link href="/signup" className="font-semibold text-brand-teal-light hover:text-white">
                  Register
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══ Sticky header ═══════════════════════════════════════════════════ */}
      <div
        className={cn(
          "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-md transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled ? "border-transparent shadow-[0_14px_34px_-24px_rgb(10_42_51/0.55)]" : "border-border/70"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "brand-gradient absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        />

        <div className="container flex h-[72px] items-center gap-3">
          <LogoMark height={46} />

          {/* Desktop rail — grouped sections, not a flat link list */}
          <NavigationMenu viewport={false} className="ml-4 hidden min-w-0 xl:block">
            <NavigationMenuList className="flex gap-0.5 whitespace-nowrap">
              <NavigationMenuItem>
                <NavigationMenuTrigger data-active={pathname.startsWith("/product")} className="nav-pill">
                  <Gift className="nav-pill__icon size-4" aria-hidden />
                  Shop All
                </NavigationMenuTrigger>
                <NavigationMenuContent className={PANEL_SHELL}>
                  <ShopAllPanel categories={productCategories} />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger
                  data-active={pathname.startsWith("/category/diwali") || pathname === "/category"}
                  className="nav-pill"
                >
                  <Sparkles className="nav-pill__icon size-4" aria-hidden />
                  Festive &amp; Gifting
                </NavigationMenuTrigger>
                <NavigationMenuContent className={PANEL_SHELL}>
                  <OccasionPanel occasions={occasions.picked} promos={occasions.promos} />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="nav-pill">
                  <Building2 className="nav-pill__icon size-4" aria-hidden />
                  Programmes
                </NavigationMenuTrigger>
                <NavigationMenuContent className={PANEL_SHELL}>
                  <ProgrammePanel programmes={programmes} onBook={() => setBookingOpen(true)} />
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className="nav-pill">
                  Company
                </NavigationMenuTrigger>
                <NavigationMenuContent className={PANEL_SHELL}>
                  <CompanyPanel onBook={() => setBookingOpen(true)} />
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1.5">
            <SearchOverlay
              ref={searchWrapRef}
              open={searchOpen}
              query={searchQuery}
              setQuery={setSearchQuery}
              inputRef={inputRef}
              onOpen={openSearch}
              onClose={closeSearch}
              onSubmit={handleSearch}
              isSearching={isSearching}
              suggestions={suggestions}
              recent={recent}
              total={suggestionTotal}
              onPick={(href) => {
                closeSearch();
                router.push(href);
              }}
            />

            <Link
              href="/wishlist"
              className="icon-btn"
              aria-label="Wishlist"
              title="Gifting ideas"
            >
              <Heart className="size-[18px]" aria-hidden />
            </Link>

            <CartSidebar compact />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="icon-btn" aria-label="Account menu">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-primary text-[10px] font-bold text-primary-foreground">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl p-1.5">
                  <DropdownMenuLabel className="px-2.5 py-2 font-normal">
                    <p className="text-sm leading-none font-semibold">
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
                  {user.role === "VENDOR" && (
                    <DropdownMenuItem asChild className="rounded-lg">
                      <Link href="/vendor">
                        <LayoutDashboard className="mr-2 size-4" aria-hidden /> Seller Console
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
            ) : (
              <Link href="/login" className="icon-btn hidden sm:grid" aria-label="Sign in" title="Sign in">
                <UserCircle className="size-[18px]" aria-hidden />
              </Link>
            )}

            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="ml-1 hidden h-10 shrink-0 items-center gap-2 rounded-full bg-secondary px-5 text-[13px] font-bold text-secondary-foreground shadow-accent transition-colors hover:bg-brand-magenta-strong lg:inline-flex"
            >
              <CalendarDays className="size-4" aria-hidden /> Book a Meeting
            </button>

            {/* Mobile / tablet sheet trigger */}
            <div className="xl:hidden">
              <MobileNav
                productCategories={productCategories}
                specialCategories={specialCategories}
                user={user}
                onBook={() => setBookingOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <BookMeetingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </nav>
  );
}

/**
 * Mega panels share one shell so they read as a family: gradient rule on top,
 * rounded bottom corners, one strong shadow.
 */
const PANEL_SHELL =
  "group-data-[viewport=false]/navigation-menu:mt-2 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-b-2xl group-data-[viewport=false]/navigation-menu:rounded-t-none group-data-[viewport=false]/navigation-menu:bg-background group-data-[viewport=false]/navigation-menu:shadow-[0_40px_80px_-32px_rgb(10_42_51/0.45)] group-data-[viewport=false]/navigation-menu:ring-1 group-data-[viewport=false]/navigation-menu:ring-border p-0";

/* ═══════════════════════════════════════════════════════════════════════════
 * Search overlay
 * ═════════════════════════════════════════════════════════════════════════ */

function SearchOverlay({
  ref,
  open,
  query,
  setQuery,
  inputRef,
  onOpen,
  onClose,
  onSubmit,
  isSearching,
  suggestions,
  recent,
  total,
  onPick,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  open: boolean;
  query: string;
  setQuery: (v: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onOpen: () => void;
  onClose: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  isSearching: boolean;
  suggestions: SearchSuggestions;
  recent: string[];
  total: number;
  onPick: (href: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "ml-1 hidden h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[13px] text-muted-foreground transition-colors hover:border-brand-teal/45 hover:text-brand-teal-deep lg:inline-flex lg:w-52 xl:w-64",
          open && "border-brand-teal/45 text-brand-teal-deep"
        )}
        aria-label="Search products"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">Search gifts, kits, hampers…</span>
        <kbd className="ml-auto hidden h-5 items-center rounded border border-border bg-background px-1.5 font-sans text-[10px] font-bold xl:inline-flex">
          /
        </kbd>
      </button>
      <button type="button" onClick={onOpen} className="icon-btn lg:hidden" aria-label="Search products">
        <Search className="size-[18px]" aria-hidden />
      </button>

      {/* Full-width overlay anchored to the header */}
      <div
        ref={ref}
        className={cn(
          "absolute inset-x-0 top-full z-50 origin-top border-b border-border bg-background/98 backdrop-blur-md transition-[opacity,transform] duration-200",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0"
        )}
        aria-hidden={!open}
      >
        <span aria-hidden className="brand-gradient absolute inset-x-0 top-0 h-[2px] opacity-80" />
        <div className="container py-5">
          <form onSubmit={onSubmit} role="search" className="flex items-center gap-3 border-b-2 border-brand-teal/30 pb-3 focus-within:border-brand-teal">
            <Search className="size-5 shrink-0 text-primary" aria-hidden />
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              tabIndex={open ? 0 : -1}
              className="h-9 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted-foreground/70 [&::-webkit-search-cancel-button]:hidden"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="site-search-panel"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="submit"
              tabIndex={open ? 0 : -1}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-teal-strong px-4 text-[13px] font-bold text-white transition-colors hover:bg-brand-teal-deep"
            >
              {isSearching ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Search
            </button>
            <button
              type="button"
              onClick={onClose}
              tabIndex={open ? 0 : -1}
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-2 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              <kbd className="font-sans">Esc</kbd>
            </button>
          </form>

          <div id="site-search-panel" className="mt-5 max-h-[26rem] min-h-[8.5rem] overflow-y-auto">
            {query.trim().length < 2 ? (
              <div>
                {recent.length > 0 && (
                  <>
                    <p className="eyebrow mb-3 text-muted-foreground">Recent searches</p>
                    <div className="mb-6 flex flex-wrap gap-2">
                      {recent.map((term) => (
                        <button
                          key={term}
                          type="button"
                          tabIndex={open ? 0 : -1}
                          onClick={() => setQuery(term)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand-teal/45 hover:text-foreground"
                        >
                          <History className="size-3.5 text-muted-foreground/70" aria-hidden />
                          {term}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <p className="eyebrow mb-3 text-muted-foreground">Popular searches</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      tabIndex={open ? 0 : -1}
                      onClick={() => onPick(`/product?q=${encodeURIComponent(term)}`)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold transition-colors hover:border-brand-teal/45 hover:bg-accent hover:text-accent-foreground"
                    >
                      <Sparkles className="size-3.5 text-primary" aria-hidden />
                      {term}
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid gap-2 border-t border-dashed pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  {PANEL_FOOTER.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={label}
                      href={href}
                      tabIndex={open ? 0 : -1}
                      onClick={onClose}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors hover:bg-muted"
                    >
                      <Icon className="size-4 text-primary" aria-hidden />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : total === 0 && !isSearching ? (
              <div className="py-6 text-center">
                <p className="text-sm font-semibold">No matches for &quot;{query}&quot;</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a broader term, or ask us for a custom recommendation.
                </p>
                <button
                  type="button"
                  onClick={() => onSubmit()}
                  className="mt-3 text-sm font-bold text-primary hover:underline"
                >
                  Search the full catalogue
                </button>
              </div>
            ) : (
              <div className="grid min-h-[8.5rem] gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="eyebrow text-muted-foreground">
                      Products {suggestions.products.length > 0 && `· ${suggestions.products.length}`}
                    </h3>
                    <span className="text-[11px] text-muted-foreground">Enter ↵ for all results</span>
                  </div>
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {suggestions.products.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          tabIndex={open ? 0 : -1}
                          onClick={() => onPick(`/product/${product.slug}`)}
                          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted"
                        >
                          <span className="studio relative size-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/5">
                            <Image
                              src={product.image}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-contain p-0.5 mix-blend-multiply dark:mix-blend-normal"
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-semibold">{product.name}</span>
                            <span className="block truncate text-[11.5px] text-muted-foreground">
                              {product.brand} · {product.category}
                            </span>
                          </span>
                          <span className="shrink-0 text-right text-[13px] font-bold tabular-nums">
                            {product.price ? (
                              <>
                                {formatCurrency(product.price)}
                                {product.pricingMode === "BULK" && (
                                  <span className="block text-[10px] font-medium text-muted-foreground">from / pc</span>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] font-semibold text-muted-foreground">On request</span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {suggestions.products.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[12.5px] text-muted-foreground">
                      No products match &quot;{query}&quot; yet — try a category on the right, or
                      <Link href="/contact-us" onClick={onClose} className="ml-1 font-semibold text-primary hover:underline">
                        ask us for a recommendation
                      </Link>
                      .
                    </p>
                  )}
                </div>

                <div className="min-w-0 border-t border-dashed pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
                  {suggestions.categories.length > 0 && (
                    <>
                      <h3 className="eyebrow mb-2 text-muted-foreground">Categories</h3>
                      <ul className="flex flex-col gap-0.5">
                        {suggestions.categories.map((category) => (
                          <li key={category.id}>
                            <button
                              type="button"
                              tabIndex={open ? 0 : -1}
                              onClick={() => onPick(`/category/${category.slug}`)}
                              className="group/cat flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted"
                            >
                              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-accent text-primary">
                                {category.image ? (
                                  <span className="relative size-full">
                                    <Image
                                      src={category.image}
                                      alt=""
                                      fill
                                      sizes="32px"
                                      className="object-contain p-0.5 mix-blend-multiply dark:mix-blend-normal"
                                    />
                                  </span>
                                ) : (
                                  <Gift className="size-4" aria-hidden />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold">{category.title}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">
                                  {category.count} {category.count === 1 ? "product" : "products"}
                                </span>
                              </span>
                              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {suggestions.brands.length > 0 && (
                    <>
                      <h3 className="eyebrow mt-4 mb-2 text-muted-foreground">Brands</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.brands.map((brand) => (
                          <button
                            key={brand.id}
                            type="button"
                            tabIndex={open ? 0 : -1}
                            onClick={() => onPick(`/product?brands=${brand.id}`)}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[12px] font-semibold transition-colors hover:border-brand-magenta/40 hover:bg-secondary/10 hover:text-brand-magenta-strong"
                          >
                            {brand.name}
                            <span className="text-[10px] font-medium text-muted-foreground">{brand.count}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Mega panels
 * ═════════════════════════════════════════════════════════════════════════ */

/** Shared panel header: eyebrow on the left, "view all" chip on the right. */
function PanelHead({
  eyebrow,
  href,
  action,
  title,
  description,
}: {
  eyebrow: string;
  href: string;
  action: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="eyebrow text-muted-foreground">{eyebrow}</p>
        {title && <p className="display mt-2 text-[1.35rem] text-foreground">{title}</p>}
        {description && <p className="mt-1 max-w-xl text-[13px] text-muted-foreground">{description}</p>}
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[12.5px] font-bold text-accent-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {action} <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

/** A category card: thumb + title + its subcategories as inline links. */
function CategoryCard({ category }: { category: CategoryNode }) {
  return (
    <div className="group/card min-w-0">
      <Link href={`/category/${category.slug}`} className="flex items-center gap-2.5">
        {/* Brand-tinted plate: most catalogue shots are white products on white,
            so an untinted tile looks like an empty square. */}
        <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-accent ring-1 ring-brand-teal/15 transition-colors group-hover/card:ring-brand-teal/45">
          {category.image ? (
            <Image
              src={category.image}
              alt=""
              fill
              sizes="40px"
              /* Product shots are white-background cut-outs: multiply drops the
                 white into the tinted plate so the tile never reads as blank. */
              className="object-contain p-1 mix-blend-multiply transition-transform duration-500 group-hover/card:scale-110 dark:mix-blend-normal"
            />
          ) : (
            <Gift className="size-4 text-primary" aria-hidden />
          )}
        </span>
        <span className="min-w-0 text-[13.5px] leading-tight font-bold tracking-tight transition-colors group-hover/card:text-primary">
          {category.title}
        </span>
      </Link>
      {category.children.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 pl-[3.1rem]">
          {category.children.map((child) => (
            <li key={child.id}>
              <Link
                href={`/category/${child.slug}`}
                className="block truncate text-[12px] leading-snug text-muted-foreground transition-colors hover:text-brand-teal-deep"
              >
                {child.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Compact promo tile that sits inside the category grid. */
function PromoTile({
  href,
  image,
  eyebrow,
  title,
}: {
  href: string;
  image: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="group/promo relative isolate flex h-[7.5rem] flex-col justify-end overflow-hidden rounded-xl bg-brand-ink p-3.5"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="240px"
        className="object-cover opacity-80 transition-transform duration-700 group-hover/promo:scale-105"
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/55 to-transparent" />
      <span className="relative">
        <span className="kicker text-brand-magenta-light">{eyebrow}</span>
        <span className="mt-1 flex items-center gap-1.5 text-[13.5px] font-bold text-white">
          {title}
          <ArrowRight className="size-3.5 transition-transform group-hover/promo:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </Link>
  );
}

/** Panel footer: four quick routes every visitor ends up needing. */
function PanelFooter() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-surface/70 px-6 py-3">
      {PANEL_FOOTER.map(({ label, href, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <Icon className="size-3.5 text-primary" aria-hidden />
          {label}
        </Link>
      ))}
      <a
        href={SITE.phoneHref}
        className="ml-auto inline-flex items-center gap-2 text-[12.5px] font-bold text-foreground"
      >
        <Phone className="size-3.5 text-brand-magenta" aria-hidden />
        {SITE.phone}
      </a>
    </div>
  );
}

function ShopAllPanel({ categories }: { categories: CategoryNode[] }) {
  // Ten category cards + two promo tiles fill a 4 × 3 grid exactly — no
  // half-empty rows, which is what made the old 3-column layout feel airy.
  const grouped = categories.filter((c) => c.children.length > 0);
  const leaves = categories.filter((c) => c.children.length === 0);

  return (
    <div className="relative w-[min(calc(100vw-10rem),1060px)]">
      <span aria-hidden className="brand-gradient absolute inset-x-0 top-0 h-[3px]" />
      <div className="px-6 pt-6 pb-5">
        <PanelHead
          eyebrow="Browse the catalogue"
          href="/product"
          action="All products"
          title="Shop by category"
          description="Ten core categories, 70+ variants — filter by price slab, MOQ and brand on the listing page."
        />
        <div className="grid grid-cols-4 gap-x-6 gap-y-5">
          {grouped.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          <PromoTile
            href="/category/diwali-gift-hampers"
            image="/images/product/themes/diwali-gift-hampers-37-2024-09.webp"
            eyebrow="Festive season"
            title="Diwali hampers"
          />
          <PromoTile
            href="/category/onboarding-joining-kits"
            image="/images/product/themes/employee-joining-welcome-kit-02-2024-09.webp"
            eyebrow="HR & onboarding"
            title="Joining kits"
          />
        </div>
        {leaves.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {leaves.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-full border border-border bg-surface px-3 py-1 text-[12px] font-semibold transition-colors hover:border-brand-magenta/40 hover:bg-secondary/10 hover:text-brand-magenta-strong"
              >
                {category.title}
              </Link>
            ))}
          </div>
        )}
      </div>
      <PanelFooter />
    </div>
  );
}

function OccasionPanel({
  occasions,
  promos,
}: {
  occasions: CategoryNode[];
  promos: { title: string; copy: string; href: string; image: string }[];
}) {
  return (
    <div className="relative w-[min(calc(100vw-10rem),880px)]">
      <span aria-hidden className="brand-gradient absolute inset-x-0 top-0 h-[3px]" />
      <div className="p-7 pt-8">
        <PanelHead
          eyebrow="Occasions & moments"
          href="/category"
          action="All categories"
          title="Gift for the moment"
          description="Festival, joining, milestone or thank-you — start from the occasion and we will shape the box."
        />
        <div className="grid grid-cols-3 gap-3">
          {occasions.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group/occ relative isolate flex h-32 flex-col justify-end overflow-hidden rounded-xl bg-brand-ink p-4 ring-1 ring-foreground/[0.06]"
            >
              {category.image && (
                <Image
                  src={category.image}
                  alt=""
                  fill
                  sizes="260px"
                  className="object-cover opacity-70 transition-transform duration-700 group-hover/occ:scale-105"
                />
              )}
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/60 to-brand-ink/10" />
              <span className="relative">
                <span className="block text-[14.5px] leading-tight font-bold text-white">{category.title}</span>
                {category.children.length > 0 && (
                  <span className="mt-0.5 block truncate text-[11.5px] text-white/60">
                    {category.children.map((c) => c.title).join(" · ")}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {promos.map((promo) => (
            <Link
              key={promo.title}
              href={promo.href}
              className="group/p2 flex items-center gap-3.5 rounded-xl border border-border/70 bg-surface p-3 transition-colors hover:border-brand-teal/40"
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg">
                <Image src={promo.image} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold transition-colors group-hover/p2:text-primary">
                  {promo.title}
                </span>
                <span className="block text-[12px] text-muted-foreground">{promo.copy}</span>
              </span>
              <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground/60" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
      <PanelFooter />
    </div>
  );
}

function ProgrammePanel({
  programmes,
  onBook,
}: {
  programmes: (CategoryNode & { copy: string })[];
  onBook: () => void;
}) {
  const icons = [Building2, Users, Laptop, Repeat, Leaf, Gift];
  return (
    <div className="relative w-[min(calc(100vw-10rem),860px)]">
      <span aria-hidden className="brand-gradient absolute inset-x-0 top-0 h-[3px]" />
      <div className="grid grid-cols-[minmax(0,1fr)_16rem]">
        <div className="p-7 pt-8">
          <PanelHead
            eyebrow="Corporate programmes"
            href="/why-us"
            action="How we work"
            title="Programmes we run"
            description="Recurring gifting with one account manager, consolidated billing and GST invoices."
          />
          <div className="grid grid-cols-2 gap-3">
            {programmes.map((programme, index) => {
              const Icon = icons[index % icons.length];
              return (
                <Link
                  key={programme.id}
                  href={`/category/${programme.slug}`}
                  className="group/prog flex items-start gap-3 rounded-xl border border-border/70 p-3.5 transition-all hover:border-brand-teal/40 hover:bg-accent/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary transition-colors group-hover/prog:bg-brand-teal group-hover/prog:text-white">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] leading-tight font-bold">{programme.title}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                      {programme.copy}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="relative isolate overflow-hidden border-l border-border/70 bg-brand-ink p-6 pt-8 text-white">
          <Image src={IMAGES.homeGrid.corporate} alt="" fill sizes="256px" className="object-cover opacity-25" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-brand-ink/80 to-brand-ink" />
          <div className="relative flex h-full flex-col">
            <span className="kicker text-brand-teal-light">Free consultation</span>
            <p className="display mt-2 text-[1.25rem] text-white">Not sure where to start?</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">
              Share your headcount, budget per head and timeline. We will send a costed proposal the same day.
            </p>
            <button
              type="button"
              onClick={onBook}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-secondary px-4 text-[13px] font-bold text-secondary-foreground shadow-accent transition-colors hover:bg-brand-magenta-strong"
            >
              <CalendarDays className="size-4" aria-hidden /> Book a 15-min call
            </button>
            <a
              href={SITE.phoneHref}
              className="mt-3 inline-flex items-center gap-2 text-[12.5px] font-semibold text-white/75 transition-colors hover:text-white"
            >
              <Phone className="size-3.5 text-brand-teal-light" aria-hidden /> {SITE.phone}
            </a>
          </div>
        </aside>
      </div>
      <PanelFooter />
    </div>
  );
}

function CompanyPanel({ onBook }: { onBook: () => void }) {
  return (
    <div className="relative w-[min(calc(100vw-10rem),660px)]">
      <span aria-hidden className="brand-gradient absolute inset-x-0 top-0 h-[3px]" />
      <div className="grid grid-cols-[minmax(0,1fr)_15rem]">
        <div className="p-7 pt-8">
          <PanelHead eyebrow="Company" href="/about-us" action="About us" title="Who we are" />
          <ul className="grid gap-1.5">
            {COMPANY_LINKS.map(({ title, href, icon: Icon, blurb }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group/co flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary transition-colors group-hover/co:bg-brand-teal group-hover/co:text-white">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold">{title}</span>
                    <span className="block text-[12px] text-muted-foreground">{blurb}</span>
                  </span>
                  <ArrowRight
                    className="mt-1.5 ml-auto size-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover/co:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <aside className="flex flex-col gap-4 border-l border-border/70 bg-surface/60 p-6 pt-8">
          <div>
            <span className="kicker text-primary">Reach us</span>
          </div>
          <a
            href={`mailto:${SITE.email}`}
            className="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-[12.5px] font-semibold transition-colors hover:border-brand-teal/40"
          >
            <span className="text-primary">@</span>
            {SITE.email}
          </a>
          <button
            type="button"
            onClick={onBook}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-teal-strong px-4 text-[13px] font-bold text-white transition-colors hover:bg-brand-teal-deep"
          >
            <CalendarDays className="size-4" aria-hidden /> Book a Meeting
          </button>
        </aside>
      </div>
      <PanelFooter />
    </div>
  );
}
