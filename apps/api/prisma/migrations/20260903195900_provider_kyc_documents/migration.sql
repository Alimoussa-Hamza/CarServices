-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('rc_pro', 'identity', 'other');

-- CreateTable
CREATE TABLE "provider_kyc_documents" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "doc_type" "KycDocumentType" NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "expires_at" DATE,
    "verified_at" TIMESTAMP(3),
    "verified_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_kyc_documents_provider_id_idx" ON "provider_kyc_documents"("provider_id");

-- CreateIndex
CREATE INDEX "provider_kyc_documents_verified_by_idx" ON "provider_kyc_documents"("verified_by");

-- AddForeignKey
ALTER TABLE "provider_kyc_documents" ADD CONSTRAINT "provider_kyc_documents_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_kyc_documents" ADD CONSTRAINT "provider_kyc_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
