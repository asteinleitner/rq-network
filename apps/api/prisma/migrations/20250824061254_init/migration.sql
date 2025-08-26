-- CreateTable
CREATE TABLE "public"."Network" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentBundleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Network_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Practice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,

    CONSTRAINT "Practice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bundle" (
    "id" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" TEXT NOT NULL,
    "practiceId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Draft" (
    "id" TEXT NOT NULL,
    "networkId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Network_name_key" ON "public"."Network"("name");

-- CreateIndex
CREATE INDEX "Assignment_practiceId_idx" ON "public"."Assignment"("practiceId");

-- CreateIndex
CREATE INDEX "Assignment_bundleId_idx" ON "public"."Assignment"("bundleId");

-- CreateIndex
CREATE UNIQUE INDEX "Draft_networkId_key" ON "public"."Draft"("networkId");

-- AddForeignKey
ALTER TABLE "public"."Practice" ADD CONSTRAINT "Practice_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "public"."Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bundle" ADD CONSTRAINT "Bundle_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "public"."Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "public"."Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "public"."Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Draft" ADD CONSTRAINT "Draft_networkId_fkey" FOREIGN KEY ("networkId") REFERENCES "public"."Network"("id") ON DELETE CASCADE ON UPDATE CASCADE;
