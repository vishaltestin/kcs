import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/shared/status-page";

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      icon={PackageSearch}
      eyebrow="Error 404"
      title="Page not found"
      description="The page you're looking for doesn't exist or may have been moved. Let's get you back to shopping."
      actions={
        <>
          <Button asChild size="lg">
            <Link href="/">
              Go Home <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/product">Browse Products</Link>
          </Button>
        </>
      }
    />
  );
}
