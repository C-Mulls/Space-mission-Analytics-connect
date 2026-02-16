-- CreateTable
CREATE TABLE "TablePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "columnOrder" JSONB NOT NULL DEFAULT '[]',
    "columnSizing" JSONB NOT NULL DEFAULT '{}',
    "columnVisibility" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TablePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TablePreference_userId_datasetId_key" ON "TablePreference"("userId", "datasetId");

-- CreateIndex
CREATE INDEX "TablePreference_userId_idx" ON "TablePreference"("userId");

-- CreateIndex
CREATE INDEX "TablePreference_datasetId_idx" ON "TablePreference"("datasetId");

-- AddForeignKey
ALTER TABLE "TablePreference" ADD CONSTRAINT "TablePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TablePreference" ADD CONSTRAINT "TablePreference_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
