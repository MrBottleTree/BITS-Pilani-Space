import { defineConfig } from 'prisma/config'
import "dotenv/config";
const databaseUrl = process.env.DATABASE_URL || 'postgresql://bps:lol@localhost:5432/bps_db';
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
})
