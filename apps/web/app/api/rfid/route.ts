import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cards = await prisma.rfidCard.findMany({
      orderBy: { label: 'asc' },
    });
    return NextResponse.json(cards);
  } catch (error) {
    console.error('Error fetching RFID cards:', error);
    return NextResponse.json({ error: 'Failed to fetch RFID cards' }, { status: 500 });
  }
}
