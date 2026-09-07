import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <ShieldAlert className="h-20 w-20 text-primary mb-6" aria-hidden />
      <p className="text-6xl font-extrabold text-primary mb-2">403</p>
      <h1 className="text-2xl font-bold mb-2">Access denied</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        You don&apos;t have permission to view this area. This section requires an administrator
        account.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login">Sign in as admin</Link>
        </Button>
      </div>
    </div>
  );
}
