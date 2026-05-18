import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activeVisits = await prisma.visit.findMany({
      where: { status: "ACTIVE" },
      include: {
        visitor: true,
        rfidCard: true,
        destinations: {
          include: {
            destination: true,
          },
        },
      },
      orderBy: { timeIn: "desc" },
    });

    return NextResponse.json(activeVisits);
  } catch (error) {
    console.error("Error fetching active visits:", error);
    return NextResponse.json({ error: "Failed to fetch active visits" }, { status: 500 });
  }
}
