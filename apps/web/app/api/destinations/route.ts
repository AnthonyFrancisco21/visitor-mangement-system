import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const destinationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  floor: z.string().min(1, "Floor is required"),
  headName: z.string().min(1, "Host/Head name is required"),
  description: z.string().optional().nullable(),
});

const updateSchema = destinationSchema.extend({
  id: z.string(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const destinations = await prisma.destination.findMany({
      where: all ? {} : { isActive: true },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = destinationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { name, floor, headName, description } = parsed.data;

    // Check if name already exists
    const existing = await prisma.destination.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Destination name already exists" },
        { status: 400 }
      );
    }

    const destination = await prisma.destination.create({
      data: {
        name,
        floor,
        headName,
        description: description || null,
        isActive: true,
      },
    });

    return NextResponse.json(destination, { status: 201 });
  } catch (error) {
    console.error("Error creating destination:", error);
    return NextResponse.json(
      { error: "Failed to create destination" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const { id, name, floor, headName, description, isActive } = parsed.data;

    // Check existence
    const destination = await prisma.destination.findUnique({
      where: { id },
    });
    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    // Check name uniqueness (excluding self)
    const existing = await prisma.destination.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Another destination with this name already exists" },
        { status: 400 }
      );
    }

    const updated = await prisma.destination.update({
      where: { id },
      data: {
        name,
        floor,
        headName,
        description: description || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating destination:", error);
    return NextResponse.json(
      { error: "Failed to update destination" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Destination ID is required" },
        { status: 400 }
      );
    }

    // Check if destination exists
    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        visitDestinations: {
          take: 1,
        },
      },
    });

    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    // If there are visits associated, we must soft-delete to prevent foreign key errors
    if (destination.visitDestinations.length > 0) {
      const softDeleted = await prisma.destination.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json(
        {
          message: "Destination soft-deleted (marked inactive) to preserve visit records.",
          destination: softDeleted,
        },
        { status: 200 }
      );
    }

    // If no visits are linked, we can safely hard-delete it!
    await prisma.destination.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Destination deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting destination:", error);
    return NextResponse.json(
      { error: "Failed to delete destination" },
      { status: 500 }
    );
  }
}
