/**
 * Parses a `mysql://user:password@host:port/database` URL into a MariaDB
 * driver pool config.
 *
 * Shared by the app client (`src/lib/db.ts`) and the seed script
 * (`prisma/seed.ts`) so `DATABASE_URL` is the single source of connection
 * truth everywhere — app runtime, Prisma CLI and seeding.
 */
export type DatabasePoolConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
};

export function parseDatabaseUrl(
  url: string,
  connectionLimit = 10,
): DatabasePoolConfig {
  const parsed = new URL(url);

  return {
    host: parsed.hostname || "localhost",
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
    connectionLimit,
  };
}
