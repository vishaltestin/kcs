#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# KCS G-Mart — one-shot bootstrap
#
# Sets up everything a fresh machine needs:
#   1. Node dependencies            (npm ci)
#   2. MariaDB                      (install + start, local dev only)
#   3. Database + user              (create if missing)
#   4. Prisma migrations + seed     (migrate deploy / db push + seed)
#   5. Production build             (next build)
#
# Usage:
#   ./scripts/bootstrap.sh            # full setup + build
#   ./scripts/bootstrap.sh --dev      # full setup, skip production build
#   ./scripts/bootstrap.sh --reset-db # wipe & re-seed the database
# ---------------------------------------------------------------------------
set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"

DB_USER="${DB_USER:-kcs}"
DB_PASSWORD="${DB_PASSWORD:-kcs_gmart_dev}"
DB_NAME="${DB_NAME:-kcs_gmart}"

log() { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
ok()  { printf "  \033[0;32m✓\033[0m %s\n" "$*"; }

# --- 1. Dependencies -------------------------------------------------------
log "Installing Node dependencies"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
ok "Dependencies installed"

# --- 2. Environment --------------------------------------------------------
if [ ! -f .env ]; then
  log "Creating .env from .env.example"
  cp .env.example .env
  # Generate a fresh AUTH_SECRET
  if command -v openssl >/dev/null 2>&1; then
    SECRET="$(openssl rand -hex 32)"
    sed -i.bak "s|^AUTH_SECRET=.*|AUTH_SECRET=\"${SECRET}\"|" .env && rm -f .env.bak
  fi
  ok ".env created — review the values before deploying"
fi

# --- 3. MariaDB / MySQL ----------------------------------------------------
log "Checking database server"
if command -v mariadb >/dev/null 2>&1 || command -v mysql >/dev/null 2>&1; then
  ok "MariaDB/MySQL client found"
else
  log "Installing MariaDB server (requires sudo/apt)"
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -qq && sudo apt-get install -y -qq mariadb-server
  else
    echo "apt-get not found. Install MariaDB/MySQL manually, then re-run." >&2
    exit 1
  fi
fi

if ! pgrep -x mariadbd >/dev/null 2>&1 && ! pgrep -x mysqld >/dev/null 2>&1; then
  log "Starting MariaDB daemon"
  sudo mkdir -p /run/mysqld && sudo chown mysql:mysql /run/mysqld
  for safe in mariadbd-safe mariadbd-safe mysqld_safe; do
    if command -v "$safe" >/dev/null 2>&1; then
      sudo "$safe" &>/tmp/mariadb-safe.log &
      break
    fi
  done
  if ! pgrep -x mariadbd >/dev/null 2>&1 && ! pgrep -x mysqld >/dev/null 2>&1; then
    sudo mariadbd --user=mysql &>/tmp/mariadbd.log &
  fi
  for _ in $(seq 1 20); do
    if mariadb-admin ping &>/dev/null 2>&1 || mysqladmin ping &>/dev/null 2>&1; then break; fi
    sleep 1
  done
fi
if mariadb-admin ping &>/dev/null 2>&1 || mysqladmin ping &>/dev/null 2>&1; then
  ok "Database server is running"
else
  echo "Could not start MariaDB. Start it manually and re-run." >&2
  exit 1
fi

# --- 4. Database + user ----------------------------------------------------
log "Creating database and user (if missing)"
SQL_STMT="CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;"
if command -v mariadb >/dev/null 2>&1; then
  CLIENT=(mariadb)
else
  CLIENT=(mysql)
fi
# Fresh installs authenticate the admin user over the unix socket.
if [ "$(id -u)" -eq 0 ]; then
  ADMIN=("${CLIENT[@]}")
elif sudo -n true 2>/dev/null; then
  ADMIN=(sudo "${CLIENT[@]}")
else
  ADMIN=("${CLIENT[@]}")
fi
"${ADMIN[@]}" <<<"$SQL_STMT" 2>/dev/null || "${CLIENT[@]}" <<<"$SQL_STMT"
ok "Database '${DB_NAME}' ready"

# --- 5. Schema + seed ------------------------------------------------------
log "Applying Prisma schema"
if [ "${1:-}" = "--reset-db" ]; then
  npx prisma migrate reset --force
else
  npx prisma migrate deploy
fi
npx prisma generate
ok "Schema applied"

log "Seeding demo data"
npx tsx prisma/seed.ts
ok "Seed complete"

# --- 6. Build --------------------------------------------------------------
if [ "${1:-}" != "--dev" ]; then
  log "Building production bundle"
  # NEXT_TURBOPACK_USE_WORKER=0 keeps the build in one process — needed on
  # machines with < 3 GB RAM; harmless elsewhere. The timeout guards against
  # environments where the build process hangs on exit after all artifacts
  # (including .next/BUILD_ID) have been written.
  NODE_OPTIONS="--max-old-space-size=1600" NEXT_TURBOPACK_USE_WORKER=0 NEXT_TELEMETRY_DISABLED=1 \
    timeout 600 npm run build || true
  if [ ! -f .next/BUILD_ID ]; then
    echo "Production build failed — .next/BUILD_ID missing." >&2
    exit 1
  fi
  pkill -f "next build" 2>/dev/null || true
  ok "Production build ready (.next/)"
fi

cat <<'BANNER'

  ┌────────────────────────────────────────────────────────────┐
  │  KCS G-Mart is ready.                                      │
  │                                                            │
  │  Development:   npm run dev                                │
  │  Production:    npm run start                              │
  │                                                            │
  │  Storefront:    http://localhost:3000                      │
  │  Admin panel:   http://localhost:3000/admin                │
  │                                                            │
  │  Admin login:   admin@kcsgmart.in / Admin@12345            │
  │  Demo customer: demo@kcsgmart.in  / Demo@12345             │
  └────────────────────────────────────────────────────────────┘

BANNER
