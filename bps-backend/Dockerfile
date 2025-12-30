FROM node:24-alpine

RUN apk add --no-cache openssl

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install

RUN cd packages/db && npx prisma generate

RUN pnpm run build

EXPOSE 3000

CMD ["/bin/sh", "-c", "\
    echo 'Moving to packages/db for migrations...'; \
    cd packages/db; \
    \
    if [ \"$DB_RESET\" = \"true\" ]; then \
        echo 'DB_RESET is true. Wiping database...'; \
        npx prisma migrate reset --force; \
    else \
        echo 'Normal startup. Applying migrations...'; \
        npx prisma migrate deploy; \
    fi; \
    \
    echo 'Moving to server directory...'; \
    cd ../../apps/http; \
    \
    echo 'Starting Server...'; \
    npm run start; \
    "]