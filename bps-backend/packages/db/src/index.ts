import { PrismaClient } from './generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = "postgresql://bps:lol@localhost:5432/bps_db";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const client = new PrismaClient({ adapter });
export default client;