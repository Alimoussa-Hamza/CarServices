import { UserRole } from '@prisma/client';
import { BookingsController } from '../bookings.controller';
import { BookingsService } from '../bookings.service';
import { SlotPickerService } from '../slot-picker.service';

const user = {
  sub: '11111111-1111-4111-8111-111111111111',
  role: UserRole.client,
};

const dto = {
  offerId: '22222222-2222-4222-8222-222222222222',
  vehicleType: 'suv' as const,
  optionIds: [],
  addressId: '33333333-3333-4333-8333-333333333333',
  slotStart: '2026-12-01T08:00:00.000Z',
  clientPhotoIds: [],
};

function controllerOf(bookingsService: object, slotPickerService: object = {}) {
  return new BookingsController(
    bookingsService as unknown as BookingsService,
    slotPickerService as unknown as SlotPickerService,
  );
}

describe('BookingsController', () => {
  it('délègue POST /bookings au service avec user.sub', async () => {
    const bookingsService = {
      create: jest.fn().mockResolvedValue({ data: { booking: { id: 'b1' } } }),
    };
    const controller = controllerOf(bookingsService);

    await expect(controller.create(user, dto)).resolves.toEqual({
      data: { booking: { id: 'b1' } },
    });
    expect(bookingsService.create).toHaveBeenCalledWith(user.sub, dto);
  });

  it('délègue GET /bookings/available au service', async () => {
    const bookingsService = {
      create: jest.fn(),
      listAvailable: jest.fn().mockResolvedValue({ data: [] }),
    };
    const controller = controllerOf(bookingsService);

    await expect(
      controller.listAvailable({
        sub: '88888888-8888-4888-8888-888888888888',
        role: UserRole.provider,
      }),
    ).resolves.toEqual({ data: [] });
    expect(bookingsService.listAvailable).toHaveBeenCalledWith(
      '88888888-8888-4888-8888-888888888888',
    );
  });

  it('délègue POST /bookings/:id/accept au service', async () => {
    const bookingsService = {
      accept: jest.fn().mockResolvedValue({ data: { status: 'accepted' } }),
    };
    const controller = controllerOf(bookingsService);

    await expect(
      controller.accept(
        { sub: '88888888-8888-4888-8888-888888888888', role: UserRole.provider },
        '77777777-7777-4777-8777-777777777777',
      ),
    ).resolves.toEqual({ data: { status: 'accepted' } });
    expect(bookingsService.accept).toHaveBeenCalledWith(
      '88888888-8888-4888-8888-888888888888',
      '77777777-7777-4777-8777-777777777777',
    );
  });

  it('délègue POST /bookings/:id/decline au service', async () => {
    const bookingsService = {
      decline: jest.fn().mockResolvedValue({ data: { declined: true } }),
    };
    const controller = controllerOf(bookingsService);

    await expect(
      controller.decline(
        { sub: '88888888-8888-4888-8888-888888888888', role: UserRole.provider },
        '77777777-7777-4777-8777-777777777777',
        {},
      ),
    ).resolves.toEqual({ data: { declined: true } });
  });

  it('délègue PATCH /bookings/:id/status au service', async () => {
    const bookingsService = {
      updateStatus: jest
        .fn()
        .mockResolvedValue({ data: { status: 'en_route' } }),
    };
    const controller = controllerOf(bookingsService);

    await expect(
      controller.updateStatus(
        { sub: '88888888-8888-4888-8888-888888888888', role: UserRole.provider },
        '77777777-7777-4777-8777-777777777777',
        { status: 'en_route' },
      ),
    ).resolves.toEqual({ data: { status: 'en_route' } });
    expect(bookingsService.updateStatus).toHaveBeenCalledWith(
      '88888888-8888-4888-8888-888888888888',
      '77777777-7777-4777-8777-777777777777',
      { status: 'en_route' },
    );
  });

  it('délègue PATCH /bookings/:id/cancel au service', async () => {
    const bookingsService = {
      cancel: jest.fn().mockResolvedValue({ data: { status: 'cancelled_by_client' } }),
    };
    const controller = controllerOf(bookingsService);

    await expect(
      controller.cancel(user, '77777777-7777-4777-8777-777777777777', {}),
    ).resolves.toEqual({ data: { status: 'cancelled_by_client' } });
    expect(bookingsService.cancel).toHaveBeenCalledWith(
      user.sub,
      user.role,
      '77777777-7777-4777-8777-777777777777',
      {},
    );
  });

  it('délègue GET /bookings au service', async () => {
    const bookingsService = {
      list: jest.fn().mockResolvedValue({ data: [] }),
    };
    const controller = controllerOf(bookingsService);

    await expect(controller.list(user, { group: 'upcoming' })).resolves.toEqual({
      data: [],
    });
    expect(bookingsService.list).toHaveBeenCalledWith(user.sub, user.role, {
      group: 'upcoming',
    });
  });

  it('délègue GET /bookings/:id au service', async () => {
    const bookingsService = {
      getById: jest.fn().mockResolvedValue({ data: { id: 'b1' } }),
    };
    const controller = controllerOf(bookingsService);

    await expect(
      controller.getById(user, '77777777-7777-4777-8777-777777777777'),
    ).resolves.toEqual({ data: { id: 'b1' } });
    expect(bookingsService.getById).toHaveBeenCalledWith(
      user.sub,
      user.role,
      '77777777-7777-4777-8777-777777777777',
    );
  });

  it('délègue POST /bookings/slots au slot picker', async () => {
    const slotDto = {
      offerId: dto.offerId,
      vehicleType: 'suv' as const,
      optionIds: [] as string[],
      addressId: dto.addressId,
    };
    const slotPickerService = {
      listSlots: jest.fn().mockResolvedValue({ data: { days: [] } }),
    };
    const controller = controllerOf({}, slotPickerService);

    await expect(controller.listSlots(user, slotDto)).resolves.toEqual({
      data: { days: [] },
    });
    expect(slotPickerService.listSlots).toHaveBeenCalledWith(user.sub, slotDto);
  });
});
