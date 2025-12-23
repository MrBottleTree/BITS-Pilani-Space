FROM node:24-alpine
WORKDIR /repo

RUN corepack enable

# cache layers
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/http/package.json apps/http/package.json
COPY packages ./packages

RUN pnpm -C apps/http install

# source
COPY . .

EXPOSE 3000
CMD ["pnpm", "-C", "apps/http", "run", "dev"]
