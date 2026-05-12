/**
 * Seed script — creates one Admin and one Receptionist account.
 *
 * Usage (from apps/web/):
 *   npx tsx prisma/seed.ts
 *
 * Credentials (change these in production!):
 *   Admin:        admin@vms.local       / Admin@1234
 *   Receptionist: receptionist@vms.local / Recept@1234
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/client/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const SALT_ROUNDS = 12;

  const adminPassword = await bcrypt.hash('Admin@1234', SALT_ROUNDS);
  const receptionistPassword = await bcrypt.hash('Recept@1234', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vms.local' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@vms.local',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'receptionist@vms.local' },
    update: {},
    create: {
      name: 'Front Desk',
      email: 'receptionist@vms.local',
      password: receptionistPassword,
      role: 'RECEPTIONIST',
    },
  });

  console.log('✅ Seeded users:');
  console.log('  Admin:', admin.email);
  console.log('  Receptionist:', receptionist.email);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

