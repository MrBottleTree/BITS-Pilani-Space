import { defineConfig } from 'prisma/config'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.rds' })

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
