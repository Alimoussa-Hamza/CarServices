import { UserRole } from '@prisma/client';
import { DisputesController } from '../disputes.controller';
import { DisputesService } from '../disputes.service';

describe('DisputesController', () => {
  it('délègue POST /disputes au service', async () => {
    const disputes = {
      create: jest.fn().mockResolvedValue({
        data: { id: 'dispute-1', bookingStatus: 'disputed' },
      }),
    };
    const controller = new DisputesController(
      disputes as unknown as DisputesService,
    );
    const user = {
      sub: '11111111-1111-4111-8111-111111111111',
      role: UserRole.client,
    };
    const dto = {
      bookingId: '77777777-7777-4777-8777-777777777777',
      reason: 'quality' as const,
      description: 'Prestation incomplète, traces partout.',
    };

    await expect(controller.create(user, dto)).resolves.toMatchObject({
      data: { id: 'dispute-1' },
    });
    expect(disputes.create).toHaveBeenCalledWith(user, dto);
  });
});
