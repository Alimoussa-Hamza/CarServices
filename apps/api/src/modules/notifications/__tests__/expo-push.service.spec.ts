import { ConfigService } from '@nestjs/config';
import { ExpoPushService } from '../expo-push.service';

describe('ExpoPushService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('mocke l’envoi sans EXPO_ACCESS_TOKEN', async () => {
    const config = {
      get: jest.fn().mockReturnValue(''),
    };
    const service = new ExpoPushService(config as unknown as ConfigService);
    expect(service.isMockMode()).toBe(true);

    await expect(
      service.send([
        {
          to: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          title: 'Hello',
          body: 'World',
        },
      ]),
    ).resolves.toEqual([
      expect.objectContaining({ status: 'ok', id: expect.stringContaining('mock_push_') }),
    ]);
  });

  it('poste vers l’API Expo avec Bearer token', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: [{ status: 'ok', id: 'Ticket-xxxx' }],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const config = {
      get: jest.fn((key: string) =>
        key === 'EXPO_ACCESS_TOKEN' ? 'expo_access_test' : undefined,
      ),
    };
    const service = new ExpoPushService(config as unknown as ConfigService);

    await expect(
      service.send([
        {
          to: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
          title: 'Hello',
          body: 'World',
        },
      ]),
    ).resolves.toEqual([{ status: 'ok', id: 'Ticket-xxxx' }]);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer expo_access_test',
        }),
      }),
    );
  });
});
