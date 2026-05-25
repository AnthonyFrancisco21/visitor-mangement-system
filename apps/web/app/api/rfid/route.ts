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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, label } = body;

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // Check if card exists
    const existing = await prisma.rfidCard.findUnique({
      where: { uid },
    });

    if (existing) {
      return NextResponse.json({ error: 'Card already exists' }, { status: 409 });
    }

    const card = await prisma.rfidCard.create({
      data: {
        uid,
        label: label || `Card ${uid.slice(-4)}`,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Error creating RFID card:', error);
    return NextResponse.json({ error: 'Failed to create RFID card' }, { status: 500 });
  }
}
