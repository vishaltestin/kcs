import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WishlistProvider } from "@/components/shop/wishlist-provider";
import { getCurrentUser } from "@/lib/auth/guards";
import { getWishlistForUser } from "@/lib/queries/wishlist";

export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // Signed-in users get their server wishlist hydrated into the provider on
  // first paint (no id flash on the heart buttons). Guests fall back to the
  // localStorage store.
  const wishlistItems = user ? await getWishlistForUser(user.id) : [];

  return (
    <WishlistProvider userId={user?.id ?? null} serverItems={wishlistItems}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Navbar user={user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } : null} />
      <main id="main-content">{children}</main>
      <Footer />
    </WishlistProvider>
  );
}
