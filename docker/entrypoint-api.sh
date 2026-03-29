#!/bin/sh
set -e
cd /app

if [ "$SKIP_DB_MIGRATE" != "1" ] && [ "$SKIP_DB_MIGRATE" != "true" ]; then
  echo "[entrypoint] prisma migrate deploy"
  npx prisma migrate deploy --schema=./packages/database/prisma/schema.prisma
else
  echo "[entrypoint] SKIP_DB_MIGRATE set; skipping migrations"
fi

exec node apps/api/dist/apps/api/src/main.js
