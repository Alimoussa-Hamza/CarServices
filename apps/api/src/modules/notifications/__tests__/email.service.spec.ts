import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email.service';

describe('EmailService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('mocke l’envoi sans BREVO_API_KEY', async () => {
    const config = { get: jest.fn().mockReturnValue('') };
    const service = new EmailService(config as unknown as ConfigService);
    expect(service.isMockMode()).toBe(true);
    await expect(
      service.send({
        to: 'client@example.com',
        subject: 'Hello',
        html: '<p>Hello</p>',
        text: 'Hello',
      }),
    ).resolves.toMatchObject({ messageId: expect.stringContaining('mock_email_') });
  });

  it('poste vers Brevo avec api-key', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ messageId: 'brevo-1' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'BREVO_API_KEY') return 'brevo_test_key';
        if (key === 'BREVO_SENDER_EMAIL') return 'noreply@carservice.fr';
        if (key === 'BREVO_SENDER_NAME') return 'CARSERVICE';
        return undefined;
      }),
    };
    const service = new EmailService(config as unknown as ConfigService);

    await expect(
      service.send({
        to: 'client@example.com',
        subject: 'Hello',
        html: '<p>Hello</p>',
        text: 'Hello',
      }),
    ).resolves.toEqual({ messageId: 'brevo-1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'brevo_test_key' }),
      }),
    );
  });
});
