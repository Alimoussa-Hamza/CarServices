-- DropIndex
DROP INDEX "service_zones_polygon_idx";

-- CreateTable
CREATE TABLE "provider_capabilities" (
    "provider_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "provider_capabilities_pkey" PRIMARY KEY ("provider_id","offer_id")
);

-- CreateIndex
CREATE INDEX "provider_capabilities_offer_id_idx" ON "provider_capabilities"("offer_id");

-- AddForeignKey
ALTER TABLE "provider_capabilities" ADD CONSTRAINT "provider_capabilities_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_capabilities" ADD CONSTRAINT "provider_capabilities_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "service_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
