import { prisma } from "../lib/prisma.js";

async function reset() {
  try {
    const rfidUid = "1088722835";
    
    // Find card
    const card = await prisma.rfidCard.findUnique({
      where: { uid: rfidUid }
    });

    if (card) {
      // Find active visits using this card
      const activeVisits = await prisma.visit.findMany({
        where: { rfidCardId: card.id }
      });

      console.log(`Found ${activeVisits.length} visits linked to this card.`);

      for (const visit of activeVisits) {
        // Delete destinations
        await prisma.visitDestination.deleteMany({
          where: { visitId: visit.id }
        });
        // Delete visit
        await prisma.visit.delete({
          where: { id: visit.id }
        });
        // Delete visitor
        await prisma.visitor.delete({
          where: { id: visit.visitorId }
        });
        console.log(`Deleted visit ${visit.id} and its visitor.`);
      }

      // Reset card status
      await prisma.rfidCard.update({
        where: { id: card.id },
        data: { status: "AVAILABLE" }
      });
      console.log("Card status set to AVAILABLE.");
    } else {
      console.log("Card not found.");
    }
  } catch (error) {
    console.error("Reset failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

reset();
