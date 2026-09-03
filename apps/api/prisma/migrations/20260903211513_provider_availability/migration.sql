-- CreateTable
CREATE TABLE "provider_availability" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_blocked_slots" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "reason" VARCHAR(255),

    CONSTRAINT "provider_blocked_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_availability_provider_id_day_of_week_idx" ON "provider_availability"("provider_id", "day_of_week");

-- CreateIndex
CREATE INDEX "provider_blocked_slots_provider_id_start_at_idx" ON "provider_blocked_slots"("provider_id", "start_at");

-- AddForeignKey
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_blocked_slots" ADD CONSTRAINT "provider_blocked_slots_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
