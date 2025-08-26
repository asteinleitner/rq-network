-- CreateEnum
CREATE TYPE "public"."RecipientType" AS ENUM ('patient', 'practice');

-- CreateTable
CREATE TABLE "public"."Patient" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PracticeKey" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "publicKeyPem" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CareEpisode" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareEpisode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "bundleHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubmissionBlob" (
    "submissionId" TEXT NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "tag" BYTEA NOT NULL,

    CONSTRAINT "SubmissionBlob_pkey" PRIMARY KEY ("submissionId")
);

-- CreateTable
CREATE TABLE "public"."SubmissionKey" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "recipientType" "public"."RecipientType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "wrappedDEK" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeKey_practiceId_isActive_idx" ON "public"."PracticeKey"("practiceId", "isActive");

-- CreateIndex
CREATE INDEX "CareEpisode_patientId_endAt_idx" ON "public"."CareEpisode"("patientId", "endAt");

-- CreateIndex
CREATE INDEX "Submission_patientId_bundleId_createdAt_idx" ON "public"."Submission"("patientId", "bundleId", "createdAt");

-- CreateIndex
CREATE INDEX "SubmissionKey_submissionId_recipientType_recipientId_idx" ON "public"."SubmissionKey"("submissionId", "recipientType", "recipientId");

-- AddForeignKey
ALTER TABLE "public"."PracticeKey" ADD CONSTRAINT "PracticeKey_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "public"."Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CareEpisode" ADD CONSTRAINT "CareEpisode_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CareEpisode" ADD CONSTRAINT "CareEpisode_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "public"."Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmissionBlob" ADD CONSTRAINT "SubmissionBlob_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmissionKey" ADD CONSTRAINT "SubmissionKey_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
