#!/bin/sh
set -e

echo "Starting Backend Entrypoint..."

cd packages/db

echo "Generating Prisma Client..."
npx prisma generate

if [ "$DB_RESET" = "true" ]; then
    echo "DB_RESET is true. Resetting database..."
    npx prisma migrate reset --force
fi

echo "Running migrations..."
npx prisma migrate dev

cd ../..

echo "Starting application..."
exec "$@"