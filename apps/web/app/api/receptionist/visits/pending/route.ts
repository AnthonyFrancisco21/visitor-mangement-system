import { NextRequest, NextResponse } from "next/server";
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

export async function DELETE(req: NextRequest) {
  try {
    const { visitId } = await req.json();

    if (!visitId) {
      return NextResponse.json({ error: "Visit ID is required" }, { status: 400 });
    }

    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
    });

    if (!visit) {
      return NextResponse.json({ error: "Visit not found" }, { status: 404 });
    }

    if (visit.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending visits can be deleted" }, { status: 400 });
    }

    // Delete the visit. Associated destinations in VisitDestination will cascade delete.
    await prisma.visit.delete({
      where: { id: visitId },
    });

    return NextResponse.json({ message: "Visit registration deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting pending visit:", error);
    return NextResponse.json({ error: error.message || "Failed to delete pending visit" }, { status: 500 });
  }
}
