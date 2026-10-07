import { HomeSkeleton } from "@/components/shared/skeletons";

/**
 * Shop layout fallback. The home page is its main consumer (every other
 * dynamic shop route has its own loading.tsx), so this is home-shaped:
 * banner mosaic + product rails + promo band.
 */
export default function ShopLoading() {
  return <HomeSkeleton />;
}
