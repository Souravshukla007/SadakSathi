-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('helmet_violation', 'triple_riding', 'wrong_side', 'plate_detection');

-- CreateEnum
CREATE TYPE "ChallanStatus" AS ENUM ('Issued', 'Paid', 'Disputed', 'Cancelled');

-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "complaintId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN     "resolutionImageUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileImageUrl" TEXT,
ADD COLUMN     "state" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDetection" (
    "id" TEXT NOT NULL,
    "frameId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrafficViolation" (
    "id" TEXT NOT NULL,
    "type" "ViolationType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "frameId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'detected',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrafficViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challan" (
    "id" TEXT NOT NULL,
    "violationId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ChallanStatus" NOT NULL DEFAULT 'Issued',

    CONSTRAINT "Challan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Challan_violationId_key" ON "Challan"("violationId");

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrafficViolation" ADD CONSTRAINT "TrafficViolation_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "VehicleDetection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_violationId_fkey" FOREIGN KEY ("violationId") REFERENCES "TrafficViolation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

