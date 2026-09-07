"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  Info,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Phone,
  Search,
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
import { Input } from "@/components/ui/input";
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
  const logout = useLogout();
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced suggestions from the server action
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchSuggestionsAction(query);
        setSuggestions(results);
        setShowSuggestions(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <nav className="w-full" aria-label="Main navigation">
      {/* Top bar */}
      <div className="w-full bg-muted md:px-20 flex justify-between">
        <div className="items-center gap-3 hidden md:flex">
          <div className="text-xs text-muted-foreground hover:text-primary transition-all">
            <Link href="/product" className="flex items-center gap-1">
              <Info size={20} strokeWidth={1.5} aria-hidden />
              Free Standard Shipping
            </Link>
          </div>
          <div className="text-xs text-muted-foreground hover:text-primary transition-all">
            <Link href="/category/curated-gift-hampers" className="flex items-center gap-1">
              <MapPin size={20} strokeWidth={1.5} aria-hidden />
              100% Customized Hampers
            </Link>
          </div>
        </div>

        <div className="flex justify-center items-center md:hidden w-[55%]">
          <div className="marquee" aria-hidden>
            <span className="marquee-inner text-[11px] text-muted-foreground">
              Free Standard Shipping | 100% Customized Hampers | 30-Day Return Policy | Secure
              Payments
            </span>
          </div>
        </div>

        <div className="flex items-center md:px-3 gap-6">
          <div className="hidden md:block w-px h-1/2 bg-border" aria-hidden />
          <div className="flex items-center">
            <ul className="hidden text-xs gap-6 lg:flex items-center">
              <li className="text-muted-foreground hover:text-primary transition-all">
                <Link href="/product">Product</Link>
              </li>
              <li className="text-muted-foreground hover:text-primary transition-all">
                <Link href="/#faq">FAQ</Link>
              </li>
              {user ? (
                <li>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Account menu"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel className="font-normal">
                        <p className="text-sm font-semibold leading-none">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground truncate">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <UserCircle className="mr-2 h-4 w-4" aria-hidden /> My Profile
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "ADMIN" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden /> Admin Console
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" aria-hidden />
                        {isLoggingOut ? "Signing out…" : "Sign out"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ) : (
                <li className="text-muted-foreground hover:text-primary transition-all">
                  <Link href="/login">Sign in</Link>
                  <span className="mx-1.5" aria-hidden>
                    /
                  </span>
                  <Link href="/signup" className="font-medium text-foreground hover:text-primary">
                    Register
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <Link
            href="/contact-us"
            className="bg-primary px-4 py-2 md:p-4 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>

      {/* Logo / search / actions */}
      <div className="w-full min-h-28 px-5 md:px-20 items-center justify-between flex gap-4 py-3">
        <div className="hidden md:block">
          <Logo />
        </div>

        {/* Search */}
        <div
          ref={searchRef}
          className="search-bar relative flex flex-1 md:max-w-2xl items-center bg-background rounded-md border-[3px] border-red-900"
        >
          <form onSubmit={handleSearch} className="flex w-full items-center gap-2 bg-background rounded-md px-2">
            <div className="relative flex-1">
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <Input
                id="site-search"
                type="search"
                role="searchbox"
                autoComplete="off"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                className="border-none shadow-none focus-visible:ring-0 focus-visible:border-transparent"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} aria-hidden />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="p-1 hover:bg-muted rounded transition-colors"
              aria-label="Search"
            >
              {isSearching ? (
                <Loader2 className="text-muted-foreground animate-spin" aria-hidden />
              ) : (
                <Search className="text-muted-foreground" aria-hidden />
              )}
            </button>
          </form>

          {/* Suggestions dropdown */}
          {showSuggestions && searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
              <div className="p-4" role="listbox" aria-label="Search suggestions">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Product Suggestions ({suggestions.length})
                  </h3>
                  <span className="text-xs text-muted-foreground">Press Enter to see all results</span>
                </div>

                {suggestions.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-muted-foreground" aria-hidden />
                    </div>
                    <h4 className="text-sm font-medium">No products found</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      We couldn&apos;t find any products matching &quot;{searchQuery}&quot;
                    </p>
                    <button onClick={handleSearch} className="text-sm font-medium text-primary hover:underline">
                      Search all products
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => handleSuggestionClick(product.slug)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-all duration-200 border border-transparent hover:border-border text-left group"
                      >
                        <div className="shrink-0 w-12 h-12 bg-muted rounded-lg overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {product.brand} • {product.category}
                          </p>
                        </div>
                        <span className="w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}

                    {suggestions.length === 8 && (
                      <div className="mt-2 pt-2 border-t">
                        <button
                          onClick={handleSearch}
                          className="w-full text-center text-sm font-medium text-primary hover:underline"
                        >
                          View all search results for &quot;{searchQuery}&quot;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone / wishlist / cart */}
        <div className="gap-4 h-full items-center hidden lg:flex">
          <a
            href={SITE.phoneHref}
            className="flex items-center gap-2 hover:text-primary transition-all"
          >
            <Phone size={30} aria-hidden />
            <span className="flex flex-col">
              <small className="text-xs">Call Us Now:</small>
              <span className="font-bold">(+91) 78 3815 2753</span>
            </span>
          </a>
          <div className="w-px h-1/4 bg-border" aria-hidden />
          <Link
            href="/wishlist"
            className="flex items-center gap-2 hover:text-primary transition-all"
          >
            <Heart aria-hidden />
            <div>
              <p className="text-xs">Gifting Ideas</p>
              <p className="font-bold text-sm leading-tight">Wishlist</p>
            </div>
          </Link>
          <CartSidebar />
        </div>

        <div className="lg:hidden">
          <MobileNav
            productCategories={productCategories}
            specialCategories={specialCategories}
            user={user}
          />
        </div>
      </div>

      {/* Main nav row */}
      <div className="w-full px-5 xl:px-20 items-center justify-between hidden lg:flex">
        <NavigationMenu>
          <NavigationMenuList className="flex gap-8">
            <NavigationMenuItem>
              <Link href="/" className="font-bold underline-animation">
                Home
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem className="underline-animation">
              <NavigationMenuTrigger className="font-bold">
                <Link href="/product" className="data-[state=open]:text-primary">
                  Product
                </Link>
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <MegaMenuPanel categories={productCategories} minWidth="lg:min-w-[900px]" />
              </NavigationMenuContent>
            </NavigationMenuItem>

            {specialCategories.length > 0 && (
              <NavigationMenuItem className="underline-animation">
                <NavigationMenuTrigger className="font-bold">Special Category</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <MegaMenuPanel categories={specialCategories} minWidth="lg:min-w-[700px]" grid />
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}

            {STATIC_LINKS.map((link) => (
              <NavigationMenuItem key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm font-bold underline-animation",
                    pathname === link.href && "text-primary"
                  )}
                >
                  {link.title}
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-8 ml-4">
          <Link href="/contact-us" className="text-sm font-bold underline-animation">
            Quick Quotation
          </Link>
          <Button onClick={() => setBookingOpen(true)} className="px-6 py-3 rounded-lg shadow">
            Book a Meeting
          </Button>
        </div>
      </div>

      <BookMeetingDialog open={bookingOpen} onOpenChange={setBookingOpen} />

      {/* Banner strip image (mobile brand reinforcement, hidden on desktop) */}
      <div className="md:hidden px-4 pb-2">
        <Image
          src={IMAGES.homeBanners[0]}
          alt="KCS G-Mart corporate gifting"
          width={800}
          height={300}
          className="rounded-md object-cover w-full h-28"
          priority
        />
      </div>
    </nav>
  );
}

function MegaMenuPanel({
  categories,
  minWidth,
  grid = false,
}: {
  categories: CategoryNode[];
  minWidth?: string;
  grid?: boolean;
}) {
  return (
    <div className="h-fit w-fit p-6 flex gap-10">
      <div
        className={cn(
          grid
            ? "lg:min-w-[700px] grid grid-cols-2 gap-x-8 gap-y-2"
            : "space-y-4 columns-2 lg:columns-4 gap-10 lg:min-h-[200px] lg:min-w-[900px]",
          minWidth
        )}
      >
        {categories.map((category) =>
          category.children.length > 0 ? (
            <div key={category.id} className="bg-background break-inside-avoid">
              <p className="text-sm font-semibold">
                <Link href={`/category/${category.slug}`} className="hover:text-primary">
                  {category.title}
                </Link>
              </p>
              <div className="flex flex-col">
                {category.children.map((child) => (
                  <Link
                    href={`/category/${child.slug}`}
                    key={child.id}
                    className="mt-1 text-xs font-normal text-muted-foreground hover:text-primary"
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link href={`/category/${category.slug}`} key={category.id} className="break-inside-avoid">
              <p className={cn(grid ? "text-base font-bold" : "text-lg font-bold", "hover:text-primary")}>
                {category.title}
              </p>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
