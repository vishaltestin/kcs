import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <PackageSearch className="h-20 w-20 text-muted-foreground/40 mb-6" aria-hidden />
      <p className="text-6xl font-extrabold text-primary mb-2">404</p>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get
        you back to shopping.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/product">Browse Products</Link>
        </Button>
      </div>
    </div>
  );
}
