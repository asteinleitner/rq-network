/*
  Warnings:

  - A unique constraint covering the columns `[orgId]` on the table `Draft` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Bundle" DROP CONSTRAINT "Bundle_networkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Draft" DROP CONSTRAINT "Draft_networkId_fkey";

-- AlterTable
ALTER TABLE "public"."Bundle" ADD COLUMN     "orgId" TEXT,
ADD COLUMN     "parentBundleId" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "scopeId" TEXT,
ALTER COLUMN "networkId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Draft" ADD COLUMN     "orgId" TEXT,
ADD COLUMN     "scope" TEXT,
ADD COLUMN     "scopeId" TEXT,
ALTER COLUMN "networkId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."Network" ADD COLUMN     "orgId" TEXT;

-- CreateTable
CREATE TABLE "public"."Org" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentBundleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Org_name_key" ON "public"."Org"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Draft_orgId_key" ON "public"."Draft"("orgId");

-- AddForeignKey
ALTER TABLE "public"."Network" ADD CONSTRAINT "Network_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bundle" ADD CONSTRAINT "Bundle_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "public"."Network"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bundle" ADD CONSTRAINT "Bundle_parentBundleId_fkey" FOREIGN KEY ("parentBundleId") REFERENCES "public"."Bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bundle" ADD CONSTRAINT "Bundle_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Draft" ADD CONSTRAINT "Draft_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "public"."Network"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Draft" ADD CONSTRAINT "Draft_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
