import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getCategoryTree } from "@/lib/queries/catalog";
import { IMAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Shop by Category",
  description:
    "Explore KCS G-Mart gifting categories — hampers, tech, apparel, drinkware, stationery and more.",
};

export default async function CategoryListingPage() {
  const categories = await getCategoryTree();

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-black text-center">Shop by Category</h1>
      <p className="text-center text-muted-foreground mt-2 mb-10 max-w-2xl mx-auto">
        Curated corporate gifting categories for every occasion, budget and brief.
      </p>

      {categories.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">Categories coming soon.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-card"
            >
              <div className="promo-slides relative aspect-[4/3] bg-muted">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    {category.title}
                  </div>
                )}
                {category.isSpecial && (
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                    Special
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold group-hover:text-primary transition-colors">
                  {category.title}
                </h2>
                {category.children.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {category.children.map((c) => c.title).join(" · ")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Promo strip */}
      <div className="mt-14 rounded-lg overflow-hidden relative">
        <Image
          src={IMAGES.drinkware}
          alt="Drinkware for corporate gifts"
          width={1500}
          height={500}
          className="w-full object-cover h-56"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center gap-3">
          <h2 className="text-2xl font-bold uppercase">Drinkwares for Corporate Gifts</h2>
          <Link
            href="/category/drinkwares"
            className="bg-primary px-6 py-3 rounded font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            SHOP NOW
          </Link>
        </div>
      </div>
    </div>
  );
}
