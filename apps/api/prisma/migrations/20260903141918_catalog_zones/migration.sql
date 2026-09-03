CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "addresses" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "label" VARCHAR(100),
    "street" VARCHAR(255) NOT NULL,
    "complement" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(10) NOT NULL,
    "country" CHAR(2) NOT NULL DEFAULT 'FR',
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_zones" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "polygon" geography(Polygon,4326) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "price_coefficient" DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    "min_booking_lead_hours" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_zones" (
    "provider_id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "radius_km" DECIMAL(5,2),

    CONSTRAINT "provider_zones_pkey" PRIMARY KEY ("provider_id","zone_id")
);

-- CreateTable
CREATE TABLE "service_categories" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_offers" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "base_price_cents" INTEGER NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "form_schema" JSONB NOT NULL,
    "checklist_template" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_options" (
    "id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "price_delta_cents" INTEGER NOT NULL DEFAULT 0,
    "duration_delta_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "offer_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_pricing" (
    "id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "price_override_cents" INTEGER,
    "vehicle_surcharges" JSONB NOT NULL,

    CONSTRAINT "zone_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "out_of_zone_leads" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "lat" DECIMAL(10,7) NOT NULL,
    "lng" DECIMAL(10,7) NOT NULL,
    "address_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "out_of_zone_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_zones_slug_key" ON "service_zones"("slug");

-- CreateIndex
CREATE INDEX "service_zones_polygon_idx" ON "service_zones" USING GIST ("polygon");

-- CreateIndex
CREATE UNIQUE INDEX "service_categories_slug_key" ON "service_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "service_offers_slug_key" ON "service_offers"("slug");

-- CreateIndex
CREATE INDEX "service_offers_category_id_idx" ON "service_offers"("category_id");

-- CreateIndex
CREATE INDEX "offer_options_offer_id_idx" ON "offer_options"("offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_options_offer_id_slug_key" ON "offer_options"("offer_id", "slug");

-- CreateIndex
CREATE INDEX "zone_pricing_offer_id_idx" ON "zone_pricing"("offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "zone_pricing_zone_id_offer_id_key" ON "zone_pricing"("zone_id", "offer_id");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_zones" ADD CONSTRAINT "provider_zones_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_zones" ADD CONSTRAINT "provider_zones_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "service_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_offers" ADD CONSTRAINT "service_offers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_options" ADD CONSTRAINT "offer_options_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "service_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_pricing" ADD CONSTRAINT "zone_pricing_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "service_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_pricing" ADD CONSTRAINT "zone_pricing_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "service_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
