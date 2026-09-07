import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { verifyEmailToken } from "@/actions/auth";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-10 text-center">
        {result.success ? (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600 mb-4" aria-hidden />
            <h1 className="text-2xl font-bold mb-2">Email verified!</h1>
            <p className="text-muted-foreground mb-6">{result.message}</p>
            <Button asChild>
              <Link href="/login">Sign in now</Link>
            </Button>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" aria-hidden />
            <h1 className="text-2xl font-bold mb-2">Verification failed</h1>
            <p className="text-muted-foreground mb-6">{result.message}</p>
            <Button asChild variant="outline">
              <Link href="/signup">Back to sign up</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
