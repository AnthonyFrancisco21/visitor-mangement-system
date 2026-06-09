import { prisma } from "../lib/prisma.js";

async function test() {
  try {
    const rfidUid = "1088722835";
    
    // Look up RFID
    const rfidCard = await prisma.rfidCard.findUnique({
      where: { uid: rfidUid }
    });
    
    console.log("RFID Card found in DB:", rfidCard);
    
    if (!rfidCard) {
      console.log("RFID card not found in DB. Creating one for testing...");
      const newCard = await prisma.rfidCard.create({
        data: {
          uid: rfidUid,
          label: "Test Card 1088722835",
          status: "AVAILABLE"
        }
      });
      console.log("Created test card:", newCard);
    }
    
    // Find a destination
    const destination = await prisma.destination.findFirst({
      where: { isActive: true }
    });
    console.log("Using destination:", destination);
    
    if (!destination) {
      throw new Error("No active destination found. Please create one.");
    }

    const fullName = ""; // leave blank to test nullable name
    const idPhotoUrl = "";
    const visitorPhotoUrl = "";
    const reason = "Testing";
    const destinationIds = [destination.id];

    // Re-check card
    const targetCard = await prisma.rfidCard.findUnique({
      where: { uid: rfidUid }
    });

    console.log("Target RFID status:", targetCard?.status);

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
          rfidCardId: targetCard!.id,
          destinations: {
            create: destinationIds.map((destinationId) => ({
              destination: { connect: { id: destinationId } },
            })),
          },
        },
      });

      await tx.rfidCard.update({
        where: { id: targetCard!.id },
        data: { status: "IN_USE" },
      });

      return { visitId: visit.id, visitorName: visitor.fullName };
    });

    console.log("Transaction succeeded!", result);
  } catch (error) {
    console.error("TRANSACTION FAILED WITH ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
