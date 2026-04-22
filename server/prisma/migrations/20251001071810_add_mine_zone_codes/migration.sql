-- CreateTable
CREATE TABLE "mine_zone_codes" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "siteName" TEXT,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mine_zone_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mine_zone_codes_company_siteName_key" ON "mine_zone_codes"("company", "siteName");
