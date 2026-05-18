import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { visitId, reason, notes } = await req.json();

    if (!visitId) {
      return NextResponse.json({ error: "Visit ID is required" }, { status: 400 });
    }

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { rfidCard: true },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    if (visit.status !== "ACTIVE") {
      return NextResponse.json({ error: "Visit is not active" }, { status: 400 });
    }

    // Update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. If visit has an RFID card, free it up
      if (visit.rfidCardId) {
        await tx.rfidCard.update({
          where: { id: visit.rfidCardId },
          data: { status: "AVAILABLE" },
        });
      }

      // 2. Update the visit status to COMPLETED or REVOKED
      const updatedVisit = await tx.visit.update({
        where: { id: visitId },
        data: {
          status: reason ? "REVOKED" : "COMPLETED",
          timeOut: new Date(),
          revokeReason: reason || null,
          revokeNote: notes || null,
        },
      });

      return updatedVisit;
    });

    return NextResponse.json({ message: "Visitor checked out successfully", result });
  } catch (error) {
    console.error("Error during checkout:", error);
    return NextResponse.json({ error: "Failed to checkout visitor" }, { status: 500 });
  }
}
