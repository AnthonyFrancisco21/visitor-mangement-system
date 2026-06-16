import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateNameSchema = z.object({
  name: z.string().min(1, "Name cannot be empty"),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: visitorId } = await params;
    const { name } = updateNameSchema.parse(await req.json());
    const updated = await prisma.visitor.update({
      where: { id: visitorId },
      data: { fullName: name },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error updating visitor name:", error);
    return NextResponse.json({ error: "Failed to update visitor name" }, { status: 500 });
  }
}
