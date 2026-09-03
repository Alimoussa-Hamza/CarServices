-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('draft', 'submitted', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "WashMethod" AS ENUM ('waterless', 'steam');

-- AlterTable
ALTER TABLE "provider_profiles" ADD COLUMN     "acceptance_rate" DECIMAL(5,2) NOT NULL DEFAULT 100,
ADD COLUMN     "avatar_url" VARCHAR(500),
ADD COLUMN     "base_address_id" UUID,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "iban" VARCHAR(34),
ADD COLUMN     "kyc_rejection_reason" TEXT,
ADD COLUMN     "kyc_status" "KycStatus" NOT NULL DEFAULT 'draft',
ADD COLUMN     "rating_avg" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rating_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripe_account_id" VARCHAR(255),
ADD COLUMN     "wash_methods" "WashMethod"[] DEFAULT ARRAY[]::"WashMethod"[];

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_base_address_id_fkey" FOREIGN KEY ("base_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
