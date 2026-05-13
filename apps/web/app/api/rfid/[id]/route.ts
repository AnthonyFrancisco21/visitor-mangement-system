import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const id = params.id;

    if (!['AVAILABLE', 'IN_USE', 'LOST', 'RETIRED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedCard = await prisma.rfidCard.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error('Error updating RFID card:', error);
    return NextResponse.json({ error: 'Failed to update RFID card' }, { status: 500 });
  }
}
