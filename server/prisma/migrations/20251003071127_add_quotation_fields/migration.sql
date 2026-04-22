-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "feedbackFromClient" TEXT,
ADD COLUMN     "quotationNumber" TEXT,
ADD COLUMN     "quotationProvidedDate" TIMESTAMP(3),
ADD COLUMN     "requestDate" TIMESTAMP(3);
