import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from '../src/modules/auth/password.util';

const prisma = new PrismaClient();

const lyonPolygonWkt =
  'POLYGON((4.771 45.707,4.902 45.707,4.902 45.815,4.771 45.815,4.771 45.707))';

async function main() {
  const adminPhone = process.env.SEED_ADMIN_PHONE ?? '+33600000000';
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? 'admin@carservice.fr';
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ?? 'AdminTest123!';
  const passwordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { phone: adminPhone },
    update: {
      role: UserRole.admin,
      email: adminEmail,
      passwordHash,
      isActive: true,
    },
    create: {
      phone: adminPhone,
      email: adminEmail,
      passwordHash,
      role: UserRole.admin,
      isActive: true,
    },
  });

  console.log(`Seed admin: ${admin.id} (${admin.email} / ${admin.phone})`);

  const category = await prisma.serviceCategory.upsert({
    where: { slug: 'wash' },
    update: {
      name: 'Lavage auto',
      description: 'Lavage automobile écologique à domicile.',
      icon: 'sparkles',
      isEnabled: true,
      sortOrder: 1,
    },
    create: {
      slug: 'wash',
      name: 'Lavage auto',
      description: 'Lavage automobile écologique à domicile.',
      icon: 'sparkles',
      isEnabled: true,
      sortOrder: 1,
    },
  });

  const commonFormSchema = {
    fields: [
      {
        key: 'vehicle_type',
        type: 'select',
        required: true,
        options: ['citadine', 'berline', 'suv', 'utilitaire', 'moto'],
      },
      {
        key: 'dirt_level',
        type: 'select',
        required: false,
        options: ['light', 'normal', 'heavy'],
      },
    ],
  };

  const checklistTemplate = {
    before: ['photos_before_front', 'photos_before_back'],
    after: ['photos_after_front', 'photos_after_back'],
    items: ['bodywork_checked', 'windows_cleaned', 'wheels_cleaned'],
  };

  const offers = [
    {
      slug: 'wash-exterior',
      name: 'Lavage extérieur',
      description: 'Nettoyage carrosserie, vitres extérieures et jantes.',
      basePriceCents: 3900,
      durationMinutes: 45,
      sortOrder: 1,
    },
    {
      slug: 'wash-interior',
      name: 'Lavage intérieur',
      description: 'Aspiration, poussières, plastiques et vitres intérieures.',
      basePriceCents: 5900,
      durationMinutes: 60,
      sortOrder: 2,
    },
    {
      slug: 'wash-complete',
      name: 'Lavage complet',
      description: 'Formule intérieure et extérieure pour un véhicule propre.',
      basePriceCents: 8500,
      durationMinutes: 90,
      sortOrder: 3,
    },
    {
      slug: 'wash-premium',
      name: 'Lavage premium',
      description: 'Nettoyage complet renforcé avec finition soignée.',
      basePriceCents: 12900,
      durationMinutes: 120,
      sortOrder: 4,
    },
  ];

  const createdOffers = [];
  for (const offer of offers) {
    createdOffers.push(
      await prisma.serviceOffer.upsert({
        where: { slug: offer.slug },
        update: {
          ...offer,
          formSchema: commonFormSchema,
          checklistTemplate,
          isActive: true,
        },
        create: {
          ...offer,
          categoryId: category.id,
          formSchema: commonFormSchema,
          checklistTemplate,
          isActive: true,
        },
      }),
    );
  }

  const options = [
    {
      slug: 'pet-hair',
      name: 'Poils animaux',
      priceDeltaCents: 1500,
      durationDeltaMinutes: 15,
    },
    {
      slug: 'heavy-dirt',
      name: 'Saleté importante',
      priceDeltaCents: 1200,
      durationDeltaMinutes: 15,
    },
    {
      slug: 'odor-treatment',
      name: 'Traitement odeurs',
      priceDeltaCents: 2000,
      durationDeltaMinutes: 20,
    },
  ];

  for (const offer of createdOffers) {
    for (const option of options) {
      await prisma.offerOption.upsert({
        where: {
          offerId_slug: {
            offerId: offer.id,
            slug: option.slug,
          },
        },
        update: { ...option, isActive: true },
        create: {
          ...option,
          offerId: offer.id,
          isActive: true,
        },
      });
    }
  }

  const [zone] = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO service_zones (
      id,
      name,
      slug,
      polygon,
      is_active,
      price_coefficient,
      min_booking_lead_hours,
      created_at
    )
    VALUES (
      gen_random_uuid(),
      'Lyon',
      'lyon',
      ST_GeogFromText(${lyonPolygonWkt}),
      true,
      1.00,
      2,
      now()
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      polygon = EXCLUDED.polygon,
      is_active = EXCLUDED.is_active,
      price_coefficient = EXCLUDED.price_coefficient,
      min_booking_lead_hours = EXCLUDED.min_booking_lead_hours
    RETURNING id::text
  `;

  if (!zone) {
    throw new Error('Lyon zone seed failed');
  }

  for (const offer of createdOffers) {
    await prisma.zonePricing.upsert({
      where: {
        zoneId_offerId: {
          zoneId: zone.id,
          offerId: offer.id,
        },
      },
      update: {
        vehicleSurcharges: {
          citadine: 0,
          berline: 500,
          suv: 1000,
          utilitaire: 1500,
          moto: 0,
        },
      },
      create: {
        zoneId: zone.id,
        offerId: offer.id,
        priceOverrideCents: null,
        vehicleSurcharges: {
          citadine: 0,
          berline: 500,
          suv: 1000,
          utilitaire: 1500,
          moto: 0,
        },
      },
    });
  }

  console.log(`Seed catalog: ${createdOffers.length} offers for zone Lyon`);

  const configDefaults: Array<{ key: string; value: number }> = [
    { key: 'commission_rate', value: 0.2 },
    { key: 'matching_timeout_t1_minutes', value: 30 },
    { key: 'matching_timeout_t2_hours', value: 2 },
    { key: 'matching_unassigned_lead_hours', value: 2 },
    { key: 'cancel_free_hours', value: 24 },
    { key: 'cancel_late_hours', value: 2 },
    { key: 'service_fee_cents', value: 0 },
  ];
  for (const row of configDefaults) {
    await prisma.platformConfig.upsert({
      where: { key: row.key },
      create: { key: row.key, value: row.value },
      update: { value: row.value },
    });
  }
  console.log(`Seed platform_config: ${configDefaults.length} keys`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
