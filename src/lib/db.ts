import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

import { parseDatabaseUrl } from "@/lib/db-url";

/**
 * Prisma client singleton (Prisma 7 + driver adapters).
 *
 * The connection is owned by a `mariadb` driver pool which is passed to
 * PrismaClient through the official MariaDB adapter. Credentials come from
 * the single `DATABASE_URL` environment variable.
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and configure it.",
    );
  }

  const adapter = new PrismaMariaDb(parseDatabaseUrl(url));
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
