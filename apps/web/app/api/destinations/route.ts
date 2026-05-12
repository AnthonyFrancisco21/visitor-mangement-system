import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const destinations = await prisma.destination.findMany({
      select: {
        id: true,
        floor: true,
        name: true,
        headName: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(destinations, { status: 200 });
  } catch (error) {
    console.error("Error fetching destinations:", error);
    return NextResponse.json(
      { error: "Failed to fetch destinations" },
      { status: 500 }
    );
  }
}
