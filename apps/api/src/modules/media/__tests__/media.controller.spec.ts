import { UserRole } from '@prisma/client';
import { MediaController } from '../media.controller';
import { MediaService } from '../media.service';

describe('MediaController', () => {
  it('délègue POST /media/upload-url au service', async () => {
    const media = {
      createUploadUrl: jest.fn().mockResolvedValue({
        data: {
          uploadUrl: 'https://cdn.carservice.test/mock-upload/key',
          fileKey: 'bookings/b/before/id.jpg',
          expiresAt: '2026-09-15T10:15:00.000Z',
        },
      }),
    };
    const controller = new MediaController(media as unknown as MediaService);
    const user = {
      sub: '11111111-1111-4111-8111-111111111111',
      role: UserRole.client,
    };
    const dto = {
      mimeType: 'image/jpeg' as const,
      context: 'booking_photo' as const,
      bookingId: '77777777-7777-4777-8777-777777777777',
      photoType: 'before' as const,
    };

    await expect(controller.createUploadUrl(user, dto)).resolves.toMatchObject({
      data: { fileKey: 'bookings/b/before/id.jpg' },
    });
    expect(media.createUploadUrl).toHaveBeenCalledWith(user, dto);
  });
});
