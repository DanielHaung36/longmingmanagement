-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" INTEGER,
ADD COLUMN     "excelRowNumber" INTEGER,
ADD COLUMN     "lastSyncTime" TIMESTAMP(3),
ADD COLUMN     "localFolderPath" TEXT,
ADD COLUMN     "mineSiteName" TEXT,
ADD COLUMN     "oneDriveFolderPath" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "syncError" TEXT,
ADD COLUMN     "syncStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED';

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "errorMessage" TEXT,
    "filesCount" INTEGER,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
