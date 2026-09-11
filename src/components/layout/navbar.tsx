import { getCategoryMenus } from "@/lib/queries/catalog";
import { getStoreSettings } from "@/lib/queries/shipping";

import { NavbarClient } from "./navbar-client";

export type NavbarUser = {
  firstName: string;
  lastName: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

/**
 * Server navbar shell — fetches the mega-menu categories, then hands them to
 * the interactive client navbar. The session user is provided by the shop
 * layout (shared with the wishlist provider, avoiding a duplicate query).
 */
export async function Navbar({ user }: { user: NavbarUser | null }) {
  const [menus, settings] = await Promise.all([
    getCategoryMenus(),
    getStoreSettings().catch(() => null),
  ]);
  const freeShippingThreshold = settings ? Number(settings.freeShippingThreshold) : 0;

  return (
    <NavbarClient
      productCategories={menus.productCategories}
      specialCategories={menus.specialCategories}
      user={user}
      freeShippingThreshold={freeShippingThreshold}
    />
  );
}
