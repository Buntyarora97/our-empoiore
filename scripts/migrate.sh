#!/bin/bash
# Run this script once to create all database tables in Neon
# Usage: DATABASE_URL="your_neon_url" bash scripts/migrate.sh

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  echo "Usage: DATABASE_URL='postgresql://...' bash scripts/migrate.sh"
  exit 1
fi

echo "Running database migrations..."
pnpm --filter @workspace/db run push
echo "✅ Database migration complete!"
