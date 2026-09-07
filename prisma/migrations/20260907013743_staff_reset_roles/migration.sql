-- AlterTable
ALTER TABLE "User" ADD COLUMN     "memberOfBusinessId" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'owner';

-- CreateIndex
CREATE INDEX "User_memberOfBusinessId_idx" ON "User"("memberOfBusinessId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_memberOfBusinessId_fkey" FOREIGN KEY ("memberOfBusinessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
