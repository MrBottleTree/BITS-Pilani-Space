FROM node:24-alpine

RUN apk add --no-cache python3

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-lock.yaml ./

RUN pnpm fetch

COPY . .

RUN pnpm install --recursive --offline --frozen-lockfile

RUN cd packages/db && npx prisma generate

RUN pnpm run build

EXPOSE 3000
EXPOSE 3001
EXPOSE 3002

CMD ["/bin/sh", "-c", "\
    echo 'Moving to packages/db for migrations...'; \
    cd packages/db; \
    echo 'Wiping database...'; \
    npx prisma migrate reset --force; \
    npx prisma migrate dev --name init; \
    echo 'Moving to server directory...'; \
    cd ../../; \
    \
    echo 'Starting Server...'; \
    pnpm run start; \
    "]