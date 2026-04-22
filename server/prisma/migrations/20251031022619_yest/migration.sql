/*
  Warnings:

  - You are about to drop the column `actualCost` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `actualEndDate` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `budget` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `contactPerson` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTonnage` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `excelRowNumber` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `feedbackFromClient` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `grade` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `localFolderPath` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `mineralType` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `oneDriveFolderPath` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `quotationNumber` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `quotationProvidedDate` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `requestDate` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `projects` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[taskCode]` on the table `tasks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jobType` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskCode` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DELETE_PENDING');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('DOCUMENT', 'CAD_DRAWING', 'IMAGE', 'VIDEO', 'DATA', 'ARCHIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MANAGER', 'ADMIN');

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_project_fkey";

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_task_fkey";

-- DropIndex
DROP INDEX "public"."projects_projectCode_key";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "images" TEXT;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "actualCost",
DROP COLUMN "actualEndDate",
DROP COLUMN "budget",
DROP COLUMN "contactEmail",
DROP COLUMN "contactPerson",
DROP COLUMN "currency",
DROP COLUMN "endDate",
DROP COLUMN "estimatedTonnage",
DROP COLUMN "excelRowNumber",
DROP COLUMN "feedbackFromClient",
DROP COLUMN "grade",
DROP COLUMN "localFolderPath",
DROP COLUMN "mineralType",
DROP COLUMN "notes",
DROP COLUMN "oneDriveFolderPath",
DROP COLUMN "quotationNumber",
DROP COLUMN "quotationProvidedDate",
DROP COLUMN "requestDate",
DROP COLUMN "startDate",
ADD COLUMN     "clientFolderPath" TEXT,
ADD COLUMN     "mineSiteFolderPath" TEXT,
ADD COLUMN     "oneDriveClientFolderPath" TEXT,
ADD COLUMN     "oneDriveMineSiteFolderPath" TEXT,
ALTER COLUMN "jobType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" INTEGER,
ADD COLUMN     "clientFeedback" TEXT,
ADD COLUMN     "contactCompany" TEXT,
ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deleteRequestedAt" TIMESTAMP(3),
ADD COLUMN     "deleteRequestedBy" INTEGER,
ADD COLUMN     "excelComment" TEXT,
ADD COLUMN     "excelRowNumber" INTEGER,
ADD COLUMN     "folderCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobType" "JobType" NOT NULL,
ADD COLUMN     "localFolderPath" TEXT,
ADD COLUMN     "mineral" TEXT,
ADD COLUMN     "oneDriveFolderPath" TEXT,
ADD COLUMN     "originalOneDrivePath" TEXT,
ADD COLUMN     "projectManager" TEXT,
ADD COLUMN     "quotationDate" TIMESTAMP(3),
ADD COLUMN     "quotationNumber" TEXT,
ADD COLUMN     "requestDate" TIMESTAMP(3),
ADD COLUMN     "syncStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED',
ADD COLUMN     "taskCode" TEXT NOT NULL,
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "project_budgets" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "budget" DECIMAL(15,2),
    "actualCost" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "project_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_files" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "localPath" TEXT NOT NULL,
    "oneDrivePath" TEXT,
    "relativePath" TEXT NOT NULL,
    "md5Hash" TEXT NOT NULL,
    "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "uploadProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uploadSessionId" TEXT,
    "totalChunks" INTEGER,
    "uploadedChunks" JSONB,
    "chunkSize" INTEGER NOT NULL DEFAULT 5242880,
    "uploadedBy" INTEGER NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_mining_info" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "mineralType" TEXT,
    "estimatedTonnage" DECIMAL(15,2),
    "grade" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,

    CONSTRAINT "project_mining_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_quotations" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "quotationNumber" TEXT,
    "requestDate" TIMESTAMP(3),
    "quotationProvidedDate" TIMESTAMP(3),
    "feedbackFromClient" TEXT,

    CONSTRAINT "project_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" SERIAL NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "taskId" INTEGER,
    "projectId" INTEGER,
    "clientCompany" TEXT NOT NULL,
    "mineSiteName" TEXT,
    "contactPerson" TEXT,
    "contactCompany" TEXT,
    "mineral" TEXT,
    "projectManager" TEXT,
    "requestDate" TIMESTAMP(3),
    "quotationDate" TIMESTAMP(3),
    "clientFeedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "amount" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "attachmentPath" TEXT,
    "createdBy" INTEGER NOT NULL,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_files" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" "FileType" NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "localPath" TEXT NOT NULL,
    "oneDrivePath" TEXT,
    "relativePath" TEXT NOT NULL,
    "md5Hash" TEXT NOT NULL,
    "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "uploadProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uploadSessionId" TEXT,
    "totalChunks" INTEGER,
    "uploadedChunks" JSONB,
    "chunkSize" INTEGER NOT NULL DEFAULT 5242880,
    "uploadedBy" INTEGER NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_budgets_projectId_key" ON "project_budgets"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_files_uploadSessionId_key" ON "project_files"("uploadSessionId");

-- CreateIndex
CREATE INDEX "project_files_md5Hash_idx" ON "project_files"("md5Hash");

-- CreateIndex
CREATE INDEX "project_files_projectId_fileType_idx" ON "project_files"("projectId", "fileType");

-- CreateIndex
CREATE INDEX "project_files_uploadSessionId_idx" ON "project_files"("uploadSessionId");

-- CreateIndex
CREATE INDEX "project_files_uploadStatus_idx" ON "project_files"("uploadStatus");

-- CreateIndex
CREATE INDEX "project_files_uploadedBy_idx" ON "project_files"("uploadedBy");

-- CreateIndex
CREATE UNIQUE INDEX "project_mining_info_projectId_key" ON "project_mining_info"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "project_quotations_projectId_key" ON "project_quotations"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNumber_key" ON "quotations"("quotationNumber");

-- CreateIndex
CREATE INDEX "quotations_quotationNumber_idx" ON "quotations"("quotationNumber");

-- CreateIndex
CREATE INDEX "quotations_taskId_idx" ON "quotations"("taskId");

-- CreateIndex
CREATE INDEX "quotations_projectId_idx" ON "quotations"("projectId");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_clientCompany_idx" ON "quotations"("clientCompany");

-- CreateIndex
CREATE UNIQUE INDEX "task_files_uploadSessionId_key" ON "task_files"("uploadSessionId");

-- CreateIndex
CREATE INDEX "task_files_md5Hash_idx" ON "task_files"("md5Hash");

-- CreateIndex
CREATE INDEX "task_files_taskId_fileType_idx" ON "task_files"("taskId", "fileType");

-- CreateIndex
CREATE INDEX "task_files_uploadSessionId_idx" ON "task_files"("uploadSessionId");

-- CreateIndex
CREATE INDEX "task_files_uploadStatus_idx" ON "task_files"("uploadStatus");

-- CreateIndex
CREATE INDEX "task_files_uploadedBy_idx" ON "task_files"("uploadedBy");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "projects_approvalStatus_idx" ON "projects"("approvalStatus");

-- CreateIndex
CREATE INDEX "projects_jobType_idx" ON "projects"("jobType");

-- CreateIndex
CREATE INDEX "projects_projectCode_idx" ON "projects"("projectCode");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_taskCode_key" ON "tasks"("taskCode");

-- CreateIndex
CREATE INDEX "tasks_approvalStatus_idx" ON "tasks"("approvalStatus");

-- CreateIndex
CREATE INDEX "tasks_assignedUserId_status_idx" ON "tasks"("assignedUserId", "status");

-- CreateIndex
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");

-- CreateIndex
CREATE INDEX "tasks_excelRowNumber_idx" ON "tasks"("excelRowNumber");

-- CreateIndex
CREATE INDEX "tasks_jobType_idx" ON "tasks"("jobType");

-- CreateIndex
CREATE INDEX "tasks_projectId_approvalStatus_idx" ON "tasks"("projectId", "approvalStatus");

-- CreateIndex
CREATE INDEX "tasks_projectId_jobType_idx" ON "tasks"("projectId", "jobType");

-- CreateIndex
CREATE INDEX "tasks_projectId_status_idx" ON "tasks"("projectId", "status");

-- CreateIndex
CREATE INDEX "tasks_status_dueDate_idx" ON "tasks"("status", "dueDate");

-- CreateIndex
CREATE INDEX "tasks_syncStatus_idx" ON "tasks"("syncStatus");

-- AddForeignKey
ALTER TABLE "project_budgets" ADD CONSTRAINT "project_budgets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_mining_info" ADD CONSTRAINT "project_mining_info_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_quotations" ADD CONSTRAINT "project_quotations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_files" ADD CONSTRAINT "task_files_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_files" ADD CONSTRAINT "task_files_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_deleteRequestedBy_fkey" FOREIGN KEY ("deleteRequestedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
