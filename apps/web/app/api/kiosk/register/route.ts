import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/client/client";
import { registerVisitorSchema } from "@/lib/validations/kiosk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate incoming data
    const parsedData = registerVisitorSchema.parse(body);
    const {
      fullName,
      idPhotoUrl,
      visitorPhotoUrl,
      destinationIds,
      reason,
    } = parsedData;

    // 2. Create visitor and create visit in a transaction
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const visitor = await tx.visitor.create({
          data: {
            fullName,
            idPhotoUrl,
            visitorPhotoUrl,
          },
        });

        // Create the visit with PENDING status
        const visit = await tx.visit.create({
          data: {
            visitorId: visitor.id,
            status: "PENDING",
            reason: reason,
            destinations: {
              create: destinationIds.map((destinationId) => ({
                destination: {
                  connect: { id: destinationId },
                },
              })),
            },
          },
        });

        return visit;
      },
    );

    return NextResponse.json(
      {
        message:
          "Registration successful. Waiting for receptionist confirmation.",
        visitId: result.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error during kiosk registration:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
