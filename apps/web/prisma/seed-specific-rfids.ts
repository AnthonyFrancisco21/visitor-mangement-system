import 'dotenv/config';
import { PrismaClient } from '../generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cards = [
    { uid: '0708916980', label: 'VISITOR NO. 10' },
    { uid: '0854372544', label: 'VISITOR NO.9' },
    { uid: '1088722835', label: 'VISITOR NO. 6' },
    { uid: '0716616213', label: 'VISITOR NO 7' },
    { uid: '1082997155', label: 'visitor NO 5' },
  ];

  let added = 0;
  for (const card of cards) {
    await prisma.rfidCard.upsert({
      where: { uid: card.uid },
      update: { label: card.label },
      create: {
        uid: card.uid,
        label: card.label,
        status: 'AVAILABLE',
      },
    });
    added++;
  }

  console.log(`Successfully seeded ${added} specific RFID cards.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
