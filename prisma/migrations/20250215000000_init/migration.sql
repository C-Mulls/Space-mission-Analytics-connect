-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "dateMin" TIMESTAMP(3),
    "dateMax" TIMESTAMP(3),
    "droppedRowCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionRow" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "rocket" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "rocketStatus" TEXT NOT NULL,
    "price" DECIMAL(14,2),
    "missionStatus" TEXT NOT NULL,

    CONSTRAINT "MissionRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateCompany" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "missionCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,

    CONSTRAINT "AggregateCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateYear" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "missionCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AggregateYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateStatus" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "missionCount" INTEGER NOT NULL,

    CONSTRAINT "AggregateStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregateRocket" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "rocket" TEXT NOT NULL,
    "missionCount" INTEGER NOT NULL,

    CONSTRAINT "AggregateRocket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Dataset_userId_uploadedAt_idx" ON "Dataset"("userId", "uploadedAt");

-- CreateIndex
CREATE INDEX "MissionRow_datasetId_date_idx" ON "MissionRow"("datasetId", "date");

-- CreateIndex
CREATE INDEX "AggregateCompany_datasetId_missionCount_idx" ON "AggregateCompany"("datasetId", "missionCount");

-- CreateIndex
CREATE INDEX "AggregateYear_datasetId_idx" ON "AggregateYear"("datasetId");

-- CreateIndex
CREATE INDEX "AggregateStatus_datasetId_idx" ON "AggregateStatus"("datasetId");

-- CreateIndex
CREATE INDEX "AggregateRocket_datasetId_idx" ON "AggregateRocket"("datasetId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionRow" ADD CONSTRAINT "MissionRow_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateCompany" ADD CONSTRAINT "AggregateCompany_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateYear" ADD CONSTRAINT "AggregateYear_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateStatus" ADD CONSTRAINT "AggregateStatus_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AggregateRocket" ADD CONSTRAINT "AggregateRocket_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
