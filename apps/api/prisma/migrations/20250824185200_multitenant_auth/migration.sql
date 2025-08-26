/*
  Warnings:

  - You are about to drop the column `orgId` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `parentBundleId` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `scopeId` on the `Bundle` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `CareEpisode` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Network` table. All the data in the column will be lost.
  - You are about to drop the column `currentBundleId` on the `Org` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Org` table. All the data in the column will be lost.
  - You are about to drop the column `orgId` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `storageKey` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the `Assignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Draft` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubmissionBlob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubmissionKey` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `networkId` on table `Bundle` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orgId` on table `Network` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `ciphertext` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `iv` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wrappedDEK` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OrgRole" AS ENUM ('ORG_OWNER', 'ORG_MEMBER', 'ORG_READONLY');

-- CreateEnum
CREATE TYPE "public"."NetworkRole" AS ENUM ('NETWORK_ADMIN', 'NETWORK_MEMBER', 'NETWORK_READONLY');

-- DropForeignKey
ALTER TABLE "public"."Assignment" DROP CONSTRAINT "Assignment_bundleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Assignment" DROP CONSTRAINT "Assignment_practiceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bundle" DROP CONSTRAINT "Bundle_networkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bundle" DROP CONSTRAINT "Bundle_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Bundle" DROP CONSTRAINT "Bundle_parentBundleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Draft" DROP CONSTRAINT "Draft_networkId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Draft" DROP CONSTRAINT "Draft_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Network" DROP CONSTRAINT "Network_orgId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubmissionBlob" DROP CONSTRAINT "SubmissionBlob_submissionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SubmissionKey" DROP CONSTRAINT "SubmissionKey_submissionId_fkey";

-- DropIndex
DROP INDEX "public"."CareEpisode_patientId_endAt_idx";

-- DropIndex
DROP INDEX "public"."Network_name_key";

-- DropIndex
DROP INDEX "public"."Submission_patientId_bundleId_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."Bundle" DROP COLUMN "orgId",
DROP COLUMN "parentBundleId",
DROP COLUMN "scope",
DROP COLUMN "scopeId",
ALTER COLUMN "networkId" SET NOT NULL,
ALTER COLUMN "meta" DROP NOT NULL,
ALTER COLUMN "data" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."CareEpisode" DROP COLUMN "createdAt";

-- AlterTable
ALTER TABLE "public"."Network" DROP COLUMN "updatedAt",
ALTER COLUMN "orgId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Org" DROP COLUMN "currentBundleId",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "public"."Patient" DROP COLUMN "orgId",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "public"."Practice" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."PracticeKey" ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Submission" DROP COLUMN "size",
DROP COLUMN "storageKey",
ADD COLUMN     "ciphertext" TEXT NOT NULL,
ADD COLUMN     "iv" TEXT NOT NULL,
ADD COLUMN     "tag" TEXT NOT NULL,
ADD COLUMN     "wrappedDEK" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Assignment";

-- DropTable
DROP TABLE "public"."Draft";

-- DropTable
DROP TABLE "public"."SubmissionBlob";

-- DropTable
DROP TABLE "public"."SubmissionKey";

-- DropEnum
DROP TYPE "public"."RecipientType";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrgMembership" (
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "role" "public"."OrgRole" NOT NULL,

    CONSTRAINT "OrgMembership_pkey" PRIMARY KEY ("userId","orgId")
);

-- CreateTable
CREATE TABLE "public"."NetworkMembership" (
    "userId" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "role" "public"."NetworkRole" NOT NULL,

    CONSTRAINT "NetworkMembership_pkey" PRIMARY KEY ("userId","networkId")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT,
    "details" JSONB,
    "actorOrgId" TEXT,
    "actorNetworkId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "OrgMembership_orgId_idx" ON "public"."OrgMembership"("orgId");

-- CreateIndex
CREATE INDEX "NetworkMembership_networkId_idx" ON "public"."NetworkMembership"("networkId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_at_idx" ON "public"."AuditLog"("actorUserId", "at");

-- CreateIndex
CREATE INDEX "AuditLog_actorOrgId_at_idx" ON "public"."AuditLog"("actorOrgId", "at");

-- CreateIndex
CREATE INDEX "AuditLog_actorNetworkId_at_idx" ON "public"."AuditLog"("actorNetworkId", "at");

-- CreateIndex
CREATE INDEX "Bundle_networkId_createdAt_idx" ON "public"."Bundle"("networkId", "createdAt");

-- CreateIndex
CREATE INDEX "CareEpisode_patientId_idx" ON "public"."CareEpisode"("patientId");

-- CreateIndex
CREATE INDEX "CareEpisode_practiceId_endAt_idx" ON "public"."CareEpisode"("practiceId", "endAt");

-- CreateIndex
CREATE INDEX "Network_orgId_idx" ON "public"."Network"("orgId");

-- CreateIndex
CREATE INDEX "Network_currentBundleId_idx" ON "public"."Network"("currentBundleId");

-- CreateIndex
CREATE INDEX "Practice_networkId_idx" ON "public"."Practice"("networkId");

-- CreateIndex
CREATE INDEX "Submission_patientId_createdAt_idx" ON "public"."Submission"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_bundleId_createdAt_idx" ON "public"."Submission"("bundleId", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_bundleHash_idx" ON "public"."Submission"("bundleHash");

-- AddForeignKey
ALTER TABLE "public"."Network" ADD CONSTRAINT "Network_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Network" ADD CONSTRAINT "Network_currentBundleId_fkey" FOREIGN KEY ("currentBundleId") REFERENCES "public"."Bundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bundle" ADD CONSTRAINT "Bundle_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "public"."Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrgMembership" ADD CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrgMembership" ADD CONSTRAINT "OrgMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NetworkMembership" ADD CONSTRAINT "NetworkMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NetworkMembership" ADD CONSTRAINT "NetworkMembership_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "public"."Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorOrgId_fkey" FOREIGN KEY ("actorOrgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorNetworkId_fkey" FOREIGN KEY ("actorNetworkId") REFERENCES "public"."Network"("id") ON DELETE SET NULL ON UPDATE CASCADE;
