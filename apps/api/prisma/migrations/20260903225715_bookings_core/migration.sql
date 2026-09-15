-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('draft', 'payment_authorized', 'pending_provider', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled_by_client', 'cancelled_by_provider', 'cancelled_by_admin', 'expired', 'unassigned', 'disputed');

-- CreateEnum
CREATE TYPE "BookingActorType" AS ENUM ('client', 'provider', 'admin', 'system');

-- CreateEnum
CREATE TYPE "BookingPhotoUploader" AS ENUM ('client', 'provider');

-- CreateEnum
CREATE TYPE "BookingPhotoType" AS ENUM ('before', 'after', 'issue');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('citadine', 'berline', 'suv', 'utilitaire', 'moto');

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(20) NOT NULL,
    "client_id" UUID NOT NULL,
    "provider_id" UUID,
    "category_slug" VARCHAR(50) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'draft',
    "address_snapshot" JSONB NOT NULL,
    "slot_start" TIMESTAMP(3) NOT NULL,
    "slot_end" TIMESTAMP(3) NOT NULL,
    "pricing_snapshot" JSONB NOT NULL,
    "commission_rate" DECIMAL(4,2) NOT NULL,
    "client_comment" TEXT,
    "provider_notes" TEXT,
    "zone_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_items" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "offer_name" VARCHAR(150) NOT NULL,
    "vehicle_type" "VehicleType" NOT NULL,
    "options_snapshot" JSONB NOT NULL,
    "form_data" JSONB NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "total_price_cents" INTEGER NOT NULL,

    CONSTRAINT "booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "from_status" "BookingStatus",
    "to_status" "BookingStatus" NOT NULL,
    "actor_type" "BookingActorType" NOT NULL,
    "actor_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_photos" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "uploaded_by" "BookingPhotoUploader" NOT NULL,
    "photo_type" "BookingPhotoType" NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bookings_reference_key" ON "bookings"("reference");

-- CreateIndex
CREATE INDEX "bookings_client_id_status_idx" ON "bookings"("client_id", "status");

-- CreateIndex
CREATE INDEX "bookings_provider_id_status_idx" ON "bookings"("provider_id", "status");

-- CreateIndex
CREATE INDEX "bookings_slot_start_zone_id_idx" ON "bookings"("slot_start", "zone_id");

-- CreateIndex
CREATE INDEX "booking_items_booking_id_idx" ON "booking_items"("booking_id");

-- CreateIndex
CREATE INDEX "booking_items_offer_id_idx" ON "booking_items"("offer_id");

-- CreateIndex
CREATE INDEX "booking_status_history_booking_id_created_at_idx" ON "booking_status_history"("booking_id", "created_at");

-- CreateIndex
CREATE INDEX "booking_photos_booking_id_photo_type_idx" ON "booking_photos"("booking_id", "photo_type");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "service_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_items" ADD CONSTRAINT "booking_items_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "service_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_photos" ADD CONSTRAINT "booking_photos_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
