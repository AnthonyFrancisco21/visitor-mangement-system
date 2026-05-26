import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id } = await params;

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Optional: check if card is IN_USE before deleting to prevent breaking active visits
    const card = await prisma.rfidCard.findUnique({ where: { id } });
    if (card?.status === 'IN_USE') {
      return NextResponse.json({ error: 'Cannot delete an RFID card that is currently in use' }, { status: 400 });
    }

    await prisma.rfidCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting RFID card:', error);
    return NextResponse.json({ error: 'Failed to delete RFID card' }, { status: 500 });
  }
}
