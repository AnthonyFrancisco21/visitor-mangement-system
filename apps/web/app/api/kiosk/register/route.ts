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
      birthDate,
      contactNumber,
      idType,
      idNumber,
      idPhotoUrl,
      visitorPhotoUrl,
      destinationIds,
      reason,
    } = parsedData;

    // 2. Check for active or pending visits if idNumber is provided
    if (idNumber) {
      const activeOrPendingVisit = await prisma.visit.findFirst({
        where: {
          visitor: {
            idNumber: idNumber,
          },
          status: {
            in: ["PENDING", "ACTIVE"],
          },
        },
      });

      if (activeOrPendingVisit) {
        return NextResponse.json(
          {
            error: "Visitor is already registered and currently active or pending.",
            visitId: activeOrPendingVisit.id,
          },
          { status: 409 } // Conflict
        );
      }
    }

    // 3. Create or update visitor and create visit in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Upsert visitor if idNumber is provided, otherwise just create
      let visitor;
      
      if (idNumber) {
        visitor = await tx.visitor.upsert({
          where: { idNumber },
          update: {
            fullName,
            birthDate,
            contactNumber,
            idType,
            idPhotoUrl,
            visitorPhotoUrl,
          },
          create: {
            fullName,
            birthDate,
            contactNumber,
            idType,
            idNumber,
            idPhotoUrl,
            visitorPhotoUrl,
          },
        });
      } else {
        visitor = await tx.visitor.create({
          data: {
            fullName,
            birthDate,
            contactNumber,
            idType,
            idPhotoUrl,
            visitorPhotoUrl,
          },
        });
      }

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
    });

    return NextResponse.json(
      { message: "Registration successful. Waiting for receptionist confirmation.", visitId: result.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during kiosk registration:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
