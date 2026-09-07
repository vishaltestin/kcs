import { Prisma } from "@prisma/client";

/**
 * True when a Prisma write failed because the target record no longer exists
 * (e.g. the row was deleted in another tab). Callers convert this into a
 * friendly ActionResult instead of surfacing a 500.
 */
export function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}
