/*
  Warnings:

  - You are about to drop the column `rfidUid` on the `Visit` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RevokeReason" AS ENUM ('LOST_CARD', 'FORGOT_TO_CHECK_OUT', 'EMERGENCY_EXIT', 'END_OF_DAY', 'OTHER');

-- CreateEnum
CREATE TYPE "RfidCardStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'LOST', 'RETIRED');

-- AlterEnum
ALTER TYPE "VisitStatus" ADD VALUE 'REVOKED';

-- DropForeignKey
ALTER TABLE "VisitDestination" DROP CONSTRAINT "VisitDestination_visitId_fkey";

-- DropIndex
DROP INDEX "Visit_rfidUid_idx";

-- DropIndex
DROP INDEX "Visitor_idNumber_key";

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "rfidUid",
ADD COLUMN     "confirmedById" TEXT,
ADD COLUMN     "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "revokeNote" TEXT,
ADD COLUMN     "revokeReason" "RevokeReason",
ADD COLUMN     "revokedById" TEXT,
ADD COLUMN     "rfidCardId" TEXT;

-- AlterTable
ALTER TABLE "VisitDestination" ADD COLUMN     "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Visitor" ADD COLUMN     "address" TEXT;

-- CreateTable
CREATE TABLE "RfidCard" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "label" TEXT,
    "status" "RfidCardStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RfidCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RfidCard_uid_key" ON "RfidCard"("uid");

-- CreateIndex
CREATE INDEX "RfidCard_uid_idx" ON "RfidCard"("uid");

-- CreateIndex
CREATE INDEX "RfidCard_status_idx" ON "RfidCard"("status");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_visitorId_idx" ON "Visit"("visitorId");

-- CreateIndex
CREATE INDEX "Visit_rfidCardId_idx" ON "Visit"("rfidCardId");

-- CreateIndex
CREATE INDEX "Visit_timeIn_idx" ON "Visit"("timeIn");

-- CreateIndex
CREATE INDEX "Visit_timeOut_idx" ON "Visit"("timeOut");

-- CreateIndex
CREATE INDEX "VisitDestination_destinationId_idx" ON "VisitDestination"("destinationId");

-- CreateIndex
CREATE INDEX "Visitor_fullName_idx" ON "Visitor"("fullName");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_rfidCardId_fkey" FOREIGN KEY ("rfidCardId") REFERENCES "RfidCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitDestination" ADD CONSTRAINT "VisitDestination_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
