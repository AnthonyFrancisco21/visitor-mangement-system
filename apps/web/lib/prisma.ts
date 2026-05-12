import 'dotenv/config';
// Import from your new generated folder, NOT "@prisma/client"
import { PrismaClient } from "../generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("[PRISMA] DATABASE_URL is not defined in environment variables.");
}

const pool = new pg.Pool({ connectionString: url });

pool.on('error', (err) => {
  console.error('[PRISMA] Unexpected error on idle client', err);
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ 
  adapter,
  log: ['query', 'error', 'warn'] 
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

