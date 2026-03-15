-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);
