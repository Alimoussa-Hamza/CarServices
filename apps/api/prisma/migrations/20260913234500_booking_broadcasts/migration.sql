-- CreateTable
CREATE TABLE "booking_broadcasts" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "score" DECIMAL(8,2) NOT NULL,
    "rank" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_broadcasts_provider_id_created_at_idx" ON "booking_broadcasts"("provider_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "booking_broadcasts_booking_id_provider_id_key" ON "booking_broadcasts"("booking_id", "provider_id");

-- AddForeignKey
ALTER TABLE "booking_broadcasts" ADD CONSTRAINT "booking_broadcasts_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_broadcasts" ADD CONSTRAINT "booking_broadcasts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
