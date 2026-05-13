/**
 * Seed script — creates staff accounts, 30 RFID cards, and sample destinations.
 *
 * Usage (from apps/web/):
 *   npx tsx prisma/seed.ts
 *
 * Staff credentials (change in production!):
 *   Admin:        admin@vms.local        / Admin@1234
 *   Receptionist: receptionist@vms.local / Recept@1234
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Pad a number to 2 digits (e.g. 1 → "01") */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Generate a fake RFID UID in the format "SGW-CARD-XX" for seeding */
function rfidUid(n: number): string {
  return `SGW-CARD-${pad(n)}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const SALT_ROUNDS = 12;

  // ── 1. Staff Accounts ──────────────────────────────────────────────────────

  const adminPassword        = await bcrypt.hash('Admin@1234',  SALT_ROUNDS);
  const receptionistPassword = await bcrypt.hash('Recept@1234', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where:  { email: 'admin@vms.local' },
    update: {},
    create: {
      name:     'System Admin',
      email:    'admin@vms.local',
      password: adminPassword,
      role:     'ADMIN',
    },
  });

  const receptionist = await prisma.user.upsert({
    where:  { email: 'receptionist@vms.local' },
    update: {},
    create: {
      name:     'Front Desk',
      email:    'receptionist@vms.local',
      password: receptionistPassword,
      role:     'RECEPTIONIST',
    },
  });

  console.log('✅ Staff accounts:');
  console.log('   Admin:        ', admin.email);
  console.log('   Receptionist: ', receptionist.email);

  // ── 2. RFID Cards (30 physical cards) ─────────────────────────────────────

  const CARD_COUNT = 30;
  let cardsCreated = 0;

  for (let i = 1; i <= CARD_COUNT; i++) {
    const uid   = rfidUid(i);
    const label = `Visitor Card ${pad(i)}`;

    await prisma.rfidCard.upsert({
      where:  { uid },
      update: {},          // do not reset status if already modified
      create: {
        uid,
        label,
        status: 'AVAILABLE',
      },
    });

    cardsCreated++;
  }

  console.log(`✅ RFID cards: ${cardsCreated} cards seeded (Card 01 – Card ${pad(CARD_COUNT)})`);

  // ── 3. Sample Destinations ─────────────────────────────────────────────────

  const destinations = [
    { name: 'Human Resources',      floor: '2', headName: 'Maria Santos',   description: 'HR Department' },
    { name: 'Finance & Accounting', floor: '3', headName: 'Jose Reyes',     description: 'Finance Office' },
    { name: 'IT Department',        floor: '4', headName: 'Carlo Lim',      description: 'Information Technology' },
    { name: 'Executive Office',     floor: '5', headName: 'Ana Dela Cruz',  description: 'C-Suite and Executive Wing' },
    { name: 'Operations',           floor: '1', headName: 'Miguel Torres',  description: 'Operations & Logistics' },
    { name: 'Marketing',            floor: '3', headName: 'Sofia Garcia',   description: 'Marketing & Communications' },
  ];

  let destCreated = 0;

  for (const dest of destinations) {
    await prisma.destination.upsert({
      where:  { id: dest.name }, // not ideal but used as stable seed key below
      update: {},
      create: dest,
    }).catch(async () => {
      // upsert by name as a fallback since id is auto-generated
      const existing = await prisma.destination.findFirst({
        where: { name: dest.name },
      });
      if (!existing) {
        await prisma.destination.create({ data: dest });
        destCreated++;
      }
    });

    destCreated++;
  }

  console.log(`✅ Destinations: ${destinations.length} sample destinations seeded`);
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
