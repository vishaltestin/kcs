import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/shared/status-page";

export default function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      icon={ShieldAlert}
      eyebrow="Restricted area"
      title="Access denied"
      description="You don't have permission to view this area. This section requires an administrator account."
      actions={
        <>
          <Button asChild size="lg">
            <Link href="/">
              Go Home <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign in as admin</Link>
          </Button>
        </>
      }
    />
  );
}
