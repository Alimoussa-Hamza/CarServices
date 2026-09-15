-- AlterTable
ALTER TABLE "provider_profiles" ADD COLUMN "charges_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_stripe_account_id_key" ON "provider_profiles"("stripe_account_id");
