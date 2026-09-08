-- AlterTable
ALTER TABLE "FinancialTransaction" ADD COLUMN     "relatedWorkshopId" TEXT;

-- CreateTable
CREATE TABLE "Workshop" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "participants" INTEGER NOT NULL DEFAULT 0,
    "operationalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitMode" TEXT NOT NULL DEFAULT 'percent',
    "profitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "giftCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetProfit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "offerPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricePerPerson" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recordedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkshopGift" (
    "id" TEXT NOT NULL,
    "workshopId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "WorkshopGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Workshop_businessId_createdAt_idx" ON "Workshop"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkshopGift_workshopId_idx" ON "WorkshopGift"("workshopId");

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_relatedWorkshopId_fkey" FOREIGN KEY ("relatedWorkshopId") REFERENCES "Workshop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workshop" ADD CONSTRAINT "Workshop_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopGift" ADD CONSTRAINT "WorkshopGift_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkshopGift" ADD CONSTRAINT "WorkshopGift_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
