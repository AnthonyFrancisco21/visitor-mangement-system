import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const rfidUid = req.nextUrl.searchParams.get("rfidUid");
  if (!rfidUid) {
    return NextResponse.json({ error: "rfidUid query parameter required" }, { status: 400 });
  }

  const rfidCard = await prisma.rfidCard.findUnique({
    where: { uid: rfidUid },
  });

  if (!rfidCard) {
    return NextResponse.json({ error: "RFID card not found in the system." }, { status: 404 });
  }

  if (rfidCard.status !== "AVAILABLE") {
    const activeVisit = await prisma.visit.findFirst({
      where: { rfidCardId: rfidCard.id, status: "ACTIVE" },
      include: { visitor: true },
    });
    const assignedTo = activeVisit?.visitor?.fullName ?? "another visitor";
    return NextResponse.json(
      {
        error: `RFID card is already in use by ${assignedTo}.`,
        isAlreadyInUse: true,
        assignedTo,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({ message: "RFID card is available", rfidCardId: rfidCard.id }, { status: 200 });
}

import { z } from "zod";


const manualCheckinSchema = z.object({
  fullName: z.string().optional().or(z.literal("")),
  idPhotoUrl: z.string().optional().or(z.literal("")),
  visitorPhotoUrl: z.string().optional().or(z.literal("")),
  destinationIds: z.array(z.string()).min(1, "At least one destination is required"),
  reason: z.string().optional(),
  rfidUid: z.string().min(1, "RFID UID is required"),
});

/**
 * POST /api/receptionist/visits/manual-checkin
 *
 * Atomically creates a Visitor + Visit as ACTIVE and assigns an RFID card
 * in a single transaction. Used exclusively by the Manual Entry wizard so
 * that manually registered visitors bypass the PENDING queue entirely.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = manualCheckinSchema.parse(body);
    const { fullName, idPhotoUrl, visitorPhotoUrl, destinationIds, reason, rfidUid } = parsed;

    // 1. Look up the RFID card
    const rfidCard = await prisma.rfidCard.findUnique({
      where: { uid: rfidUid },
    });

    if (!rfidCard) {
      return NextResponse.json({ error: "RFID card not found in the system." }, { status: 404 });
    }

    if (rfidCard.status !== "AVAILABLE") {
      const activeVisit = await prisma.visit.findFirst({
        where: { rfidCardId: rfidCard.id, status: "ACTIVE" },
        include: { visitor: true },
      });
      const assignedTo = activeVisit?.visitor?.fullName ?? "another visitor";
      return NextResponse.json(
        {
          error: `RFID card is already in use by ${assignedTo}.`,
          isAlreadyInUse: true,
          assignedTo,
        },
        { status: 400 }
      );
    }

    // 2. Single transaction: create visitor + visit (ACTIVE) + mark card IN_USE
    const result = await prisma.$transaction(async (tx) => {
      const visitor = await tx.visitor.create({
        data: {
          fullName: fullName || null,
          idPhotoUrl: idPhotoUrl || null,
          visitorPhotoUrl: visitorPhotoUrl || null,
        },
      });

      const visit = await tx.visit.create({
        data: {
          visitorId: visitor.id,
          status: "ACTIVE",
          isManualEntry: true,
          timeIn: new Date(),
          reason: reason ?? null,
          rfidCardId: rfidCard.id,
          destinations: {
            create: destinationIds.map((destinationId) => ({
              destination: { connect: { id: destinationId } },
            })),
          },
        },
      });

      await tx.rfidCard.update({
        where: { id: rfidCard.id },
        data: { status: "IN_USE" },
      });

      return { visitId: visit.id, visitorName: visitor.fullName };
    });

    return NextResponse.json(
      { message: "Visitor checked in successfully.", ...result },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error during manual check-in:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during manual check-in." },
      { status: 500 }
    );
  }
}
