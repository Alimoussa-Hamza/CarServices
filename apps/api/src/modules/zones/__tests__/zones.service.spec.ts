import { BadRequestException } from '@nestjs/common';
import { ZonesService } from '../zones.service';
import { PrismaService } from '../../../prisma/prisma.service';

function buildService() {
  const prisma = {
    $queryRaw: jest.fn(),
    outOfZoneLead: {
      create: jest.fn(),
    },
  };

  return {
    service: new ZonesService(prisma as unknown as PrismaService),
    prisma,
  };
}

describe('ZonesService', () => {
  describe('check', () => {
    it('retourne covered=true avec la zone active trouvée par PostGIS', async () => {
      const { service, prisma } = buildService();
      prisma.$queryRaw.mockResolvedValue([
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Lyon',
          slug: 'lyon',
        },
      ]);

      await expect(
        service.check({ lat: 45.764, lng: 4.835, postalCode: '69002' }),
      ).resolves.toEqual({
        data: {
          covered: true,
          zone: {
            id: '44444444-4444-4444-8444-444444444444',
            name: 'Lyon',
            slug: 'lyon',
          },
        },
      });
    });

    it('retourne covered=false quand aucun polygone actif ne couvre le point', async () => {
      const { service, prisma } = buildService();
      prisma.$queryRaw.mockResolvedValue([]);

      await expect(service.check({ lat: 44.0, lng: 4.0 })).resolves.toEqual({
        data: {
          covered: false,
          leadCaptured: false,
        },
      });
    });
  });

  describe('findCoveringZone', () => {
    it('retourne la zone active et le délai min de réservation', async () => {
      const { service, prisma } = buildService();
      prisma.$queryRaw.mockResolvedValue([
        {
          id: '44444444-4444-4444-8444-444444444444',
          name: 'Lyon',
          slug: 'lyon',
          minBookingLeadHours: 2,
        },
      ]);

      await expect(service.findCoveringZone(45.764, 4.835)).resolves.toEqual({
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Lyon',
        slug: 'lyon',
        minBookingLeadHours: 2,
      });
    });
  });

  describe('createLead', () => {
    it('crée un lead hors zone avec email', async () => {
      const { service, prisma } = buildService();
      prisma.outOfZoneLead.create.mockResolvedValue({
        id: '55555555-5555-4555-8555-555555555555',
      });

      await expect(
        service.createLead({
          email: 'client@example.com',
          lat: 44.0,
          lng: 4.0,
          addressText: 'Adresse hors zone',
        }),
      ).resolves.toEqual({
        data: {
          id: '55555555-5555-4555-8555-555555555555',
          captured: true,
        },
      });

      expect(prisma.outOfZoneLead.create).toHaveBeenCalledWith({
        data: {
          email: 'client@example.com',
          phone: undefined,
          lat: 44.0,
          lng: 4.0,
          addressText: 'Adresse hors zone',
        },
      });
    });

    it('crée un lead hors zone avec téléphone', async () => {
      const { service, prisma } = buildService();
      prisma.outOfZoneLead.create.mockResolvedValue({
        id: '55555555-5555-4555-8555-555555555555',
      });

      await expect(
        service.createLead({
          phone: '+33612345678',
          lat: 44.0,
          lng: 4.0,
          addressText: 'Adresse hors zone',
        }),
      ).resolves.toMatchObject({ data: { captured: true } });
    });

    it('rejette un lead sans email ni téléphone', async () => {
      const { service } = buildService();

      await expect(
        service.createLead({
          lat: 44.0,
          lng: 4.0,
          addressText: 'Adresse hors zone',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
