FROM node:24-alpine

RUN apk add --no-cache openssl

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install

EXPOSE 3000 

RUN chmod +x ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
CMD ["pnpm", "run", "dev"]