import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { visitId, rfidUid, reason, notes } = await req.json();

    if (!visitId && !rfidUid) {
      return NextResponse.json(
        { error: "Visit ID or RFID Card UID is required" }, 
        { status: 400 }
      );
    }

    let visitToCheckout: any = null;

    if (rfidUid) {
      // Find the card by UID
      const card = await prisma.rfidCard.findUnique({
        where: { uid: rfidUid.trim() },
      });

      if (!card) {
        return NextResponse.json(
          { error: "RFID card not recognized / not found in records." }, 
          { status: 404 }
        );
      }

      // Find the active visit for this card
      const activeVisit = await prisma.visit.findFirst({
        where: {
          rfidCardId: card.id,
          status: "ACTIVE",
        },
        include: {
          visitor: true,
          rfidCard: true,
        },
      });

      if (!activeVisit) {
        return NextResponse.json(
          { error: `RFID Card is not currently active in the building (Status: ${card.status}).` }, 
          { status: 400 }
        );
      }

      visitToCheckout = activeVisit;
    } else {
      // Find the visit by ID
      const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        include: { 
          visitor: true,
          rfidCard: true 
        },
      });

      if (!visit) {
        return NextResponse.json({ error: "Visit not found" }, { status: 404 });
      }

      if (visit.status !== "ACTIVE") {
        return NextResponse.json({ error: "Visit is not active" }, { status: 400 });
      }

      visitToCheckout = visit;
    }

    // Update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. If visit has an RFID card, free it up
      if (visitToCheckout.rfidCardId) {
        await tx.rfidCard.update({
          where: { id: visitToCheckout.rfidCardId },
          data: { status: "AVAILABLE" },
        });
      }

      // 2. Update the visit status to COMPLETED or REVOKED
      const updatedVisit = await tx.visit.update({
        where: { id: visitToCheckout.id },
        data: {
          status: reason ? "REVOKED" : "COMPLETED",
          timeOut: new Date(),
          revokeReason: reason || null,
          revokeNote: notes || null,
        },
      });

      return updatedVisit;
    });

    return NextResponse.json({ 
      message: "Visitor checked out successfully", 
      visitorName: visitToCheckout.visitor.fullName,
      result 
    });
  } catch (error) {
    console.error("Error during checkout:", error);
    return NextResponse.json({ error: "Failed to checkout visitor" }, { status: 500 });
  }
}
