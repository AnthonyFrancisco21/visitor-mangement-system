import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pendingVisits = await prisma.visit.findMany({
      where: { status: "PENDING" },
      include: {
        visitor: true,
        destinations: {
          include: {
            destination: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pendingVisits);
  } catch (error) {
    console.error("Error fetching pending visits:", error);
    return NextResponse.json({ error: "Failed to fetch pending visits" }, { status: 500 });
  }
}
