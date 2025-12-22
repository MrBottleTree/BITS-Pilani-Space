import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: "postgresql://bps:lol@localhost:5432/bps_db",
  },
})
