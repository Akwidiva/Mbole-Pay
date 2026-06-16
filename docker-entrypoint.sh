#!/bin/sh
set -e

MAX_RETRIES=30
RETRY_DELAY=2

echo "Running database migrations..."
i=0
until /prisma-migrate/node_modules/.bin/prisma migrate deploy --schema=/prisma-migrate/prisma/schema.prisma; do
  i=$((i + 1))
  if [ "$i" -ge "$MAX_RETRIES" ]; then
    echo "Database migrations failed after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Migration attempt $i failed, retrying in ${RETRY_DELAY}s..."
  sleep $RETRY_DELAY
done

echo "Starting application... http://localhost:${PORT:-3000}"
exec node server.js
