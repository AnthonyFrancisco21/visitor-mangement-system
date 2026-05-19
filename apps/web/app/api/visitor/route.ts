import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate"); // e.g. "2026-05-19"
    const endDateParam = searchParams.get("endDate");     // e.g. "2026-05-19"

    let start: Date;
    let end: Date;

    if (startDateParam) {
      start = new Date(`${startDateParam}T00:00:00`);
    } else {
      // Default to today start local time
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      start = today;
    }

    if (endDateParam) {
      end = new Date(`${endDateParam}T23:59:59.999`);
    } else {
      // Default to today end local time
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      end = today;
    }

    // Fetch visits that have been checked in (have a timeIn) within this period
    const visits = await prisma.visit.findMany({
      where: {
        timeIn: {
          gte: start,
          lte: end,
        },
      },
      include: {
        visitor: true,
        rfidCard: true,
        destinations: {
          include: {
            destination: true,
          },
        },
      },
      orderBy: {
        timeIn: "desc",
      },
    });

    // Transform data to send formatted response
    const formatted = visits.map((v) => ({
      id: v.id,
      visitorName: v.visitor.fullName,
      birthDate: v.visitor.birthDate,
      contactNumber: v.visitor.contactNumber || "—",
      idType: v.visitor.idType || "—",
      idNumber: v.visitor.idNumber || "—",
      rfidCard: v.rfidCard?.label || v.rfidCard?.uid || "—",
      destinations: v.destinations.map((d: any) => d.destination.name).join(", "),
      timeIn: v.timeIn,
      timeOut: v.timeOut,
      status: v.status, // ACTIVE, COMPLETED, REVOKED
      reason: v.reason || "General Visit",
      revokeReason: v.revokeReason,
      revokeNote: v.revokeNote,
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("Error fetching visitor history:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitor history log" }, 
      { status: 500 }
    );
  }
}
