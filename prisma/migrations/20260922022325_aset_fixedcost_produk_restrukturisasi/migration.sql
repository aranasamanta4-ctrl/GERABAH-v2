-- AlterTable
ALTER TABLE "ProductCostComponent" ADD COLUMN     "otherCategoryId" TEXT;

-- CreateTable
CREATE TABLE "ProductMaterial" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ProductMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOtherCostCategory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProductOtherCostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductChangeRequest" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "field" TEXT NOT NULL DEFAULT 'sellingPrice',
    "oldValue" DOUBLE PRECISION NOT NULL,
    "newValue" DOUBLE PRECISION NOT NULL,
    "requestedById" TEXT,
    "requestedByName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ProductChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Lainnya',
    "purchaseValue" DOUBLE PRECISION NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedCostCategory" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FixedCostCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "durationMonths" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductMaterial_productId_idx" ON "ProductMaterial"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOtherCostCategory_businessId_name_key" ON "ProductOtherCostCategory"("businessId", "name");

-- CreateIndex
CREATE INDEX "ProductChangeRequest_businessId_status_idx" ON "ProductChangeRequest"("businessId", "status");

-- CreateIndex
CREATE INDEX "ProductChangeRequest_productId_idx" ON "ProductChangeRequest"("productId");

-- CreateIndex
CREATE INDEX "Asset_businessId_idx" ON "Asset"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "FixedCostCategory_businessId_name_key" ON "FixedCostCategory"("businessId", "name");

-- CreateIndex
CREATE INDEX "FixedCost_businessId_idx" ON "FixedCost"("businessId");

-- CreateIndex
CREATE INDEX "FixedCost_categoryId_idx" ON "FixedCost"("categoryId");

-- CreateIndex
CREATE INDEX "ProductCostComponent_otherCategoryId_idx" ON "ProductCostComponent"("otherCategoryId");

-- AddForeignKey
ALTER TABLE "ProductCostComponent" ADD CONSTRAINT "ProductCostComponent_otherCategoryId_fkey" FOREIGN KEY ("otherCategoryId") REFERENCES "ProductOtherCostCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaterial" ADD CONSTRAINT "ProductMaterial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOtherCostCategory" ADD CONSTRAINT "ProductOtherCostCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductChangeRequest" ADD CONSTRAINT "ProductChangeRequest_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductChangeRequest" ADD CONSTRAINT "ProductChangeRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedCostCategory" ADD CONSTRAINT "FixedCostCategory_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedCost" ADD CONSTRAINT "FixedCost_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedCost" ADD CONSTRAINT "FixedCost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FixedCostCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
