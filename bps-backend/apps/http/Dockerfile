FROM node:24-alpine
WORKDIR /repo

RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/http/package.json apps/http/package.json

COPY packages ./packages

RUN pnpm -C apps/http install

COPY . .

EXPOSE 3000
CMD ["pnpm", "-C", "apps/http", "run", "dev"]
