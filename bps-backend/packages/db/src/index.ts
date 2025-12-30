import { PrismaClient } from './generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL || 'postgresql://bps:lol@localhost:5432/bps_db';
console.log(`DATABASE_URL=${databaseUrl}`);
console.log(`ENV DATABASE_URL=${process.env.DATABASE_URL}`);
if (!databaseUrl) {
  throw new Error("handi is not defined in environment variables");
}

const connectionString = databaseUrl;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const client = new PrismaClient({ adapter });