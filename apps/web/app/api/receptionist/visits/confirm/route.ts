import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { visitId, rfidUid, idPhotoUrl, visitorPhotoUrl, idNumber } = await req.json();

    // Find the RFID Card
    const rfidCard = await prisma.rfidCard.findUnique({
      where: { uid: rfidUid },
    });

    if (!rfidCard) {
      return NextResponse.json({ error: "RFID card not found" }, { status: 404 });
    }

    if (rfidCard.status !== "AVAILABLE") {
      return NextResponse.json({ error: "RFID card is not available" }, { status: 400 });
    }

    // Update the Visit and Visitor
    const result = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findUnique({ where: { id: visitId } });
      if (!visit || visit.status !== "PENDING") {
        throw new Error("Visit not found or not in PENDING status");
      }

      await tx.rfidCard.update({
        where: { id: rfidCard.id },
        data: { status: "IN_USE" },
      });

      const updatedVisitor = await tx.visitor.update({
        where: { id: visit.visitorId },
        data: {
          idPhotoUrl,
          visitorPhotoUrl,
          ...(idNumber ? { idNumber } : {}),
        },
      });

      const updatedVisit = await tx.visit.update({
        where: { id: visitId },
        data: {
          status: "ACTIVE",
          rfidCardId: rfidCard.id,
          timeIn: new Date(),
        },
      });

      return { visit: updatedVisit, visitor: updatedVisitor };
    });

    return NextResponse.json({ message: "Visit confirmed successfully", result });
  } catch (error: any) {
    console.error("Error confirming visit:", error);
    return NextResponse.json({ error: error.message || "Failed to confirm visit" }, { status: 500 });
  }
}
