import { UserRole } from '@prisma/client';
import { NotificationsService } from '../notifications.service';
import { UsersController } from '../users.controller';

describe('UsersController', () => {
  it('délègue POST /users/push-token au service', async () => {
    const notifications = {
      registerPushToken: jest.fn().mockResolvedValue({
        data: { id: 'token-1', token: 'ExponentPushToken[abc]' },
      }),
    };
    const controller = new UsersController(
      notifications as unknown as NotificationsService,
    );
    const user = {
      sub: '11111111-1111-4111-8111-111111111111',
      role: UserRole.client,
    };
    const dto = {
      token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' as const,
      platform: 'ios' as const,
    };

    await expect(controller.registerPushToken(user, dto)).resolves.toMatchObject(
      {
        data: { id: 'token-1' },
      },
    );
    expect(notifications.registerPushToken).toHaveBeenCalledWith(user, dto);
  });
});
