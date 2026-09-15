-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('authorized', 'captured', 'refunded', 'failed');

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "stripe_payment_intent_id" VARCHAR(255) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "commission_cents" INTEGER NOT NULL,
    "provider_net_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL,
    "captured_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_booking_id_key" ON "payments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
