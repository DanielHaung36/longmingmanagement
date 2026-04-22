-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deleteRequestedAt" TIMESTAMP(3),
ADD COLUMN     "deleteRequestedBy" INTEGER,
ALTER COLUMN "approvalStatus" SET DEFAULT 'DRAFT';
