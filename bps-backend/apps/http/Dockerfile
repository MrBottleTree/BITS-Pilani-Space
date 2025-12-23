FROM node:24-alpine
WORKDIR /repo

RUN corepack enable

# copy workspace manifests from repo root (these exist at /repo after COPY)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/http/package.json apps/http/package.json

# only needed if apps/http uses workspace packages
COPY packages ./packages

RUN pnpm -C apps/http install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm", "-C", "apps/http", "run", "dev"]
