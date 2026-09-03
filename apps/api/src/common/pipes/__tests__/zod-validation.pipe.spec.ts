import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    phone: z.string().min(10),
    code: z.string().length(6),
  });

  it('retourne les données parsées quand le payload est valide', () => {
    const pipe = new ZodValidationPipe(schema);
    const payload = { phone: '+33612345678', code: '123456' };

    expect(pipe.transform(payload, { type: 'body' })).toEqual(payload);
  });

  it('rejette un payload invalide avec une erreur métier stable', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(() =>
      pipe.transform({ phone: '123', code: '1' }, { type: 'body' }),
    ).toThrow(BadRequestException);

    try {
      pipe.transform({ phone: '123', code: '1' }, { type: 'body' });
    } catch (error) {
      const response = (error as BadRequestException).getResponse();
      expect(response).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Données invalides.',
        details: {
          phone: expect.any(Array),
          code: expect.any(Array),
        },
      });
    }
  });

  it('strip les champs inconnus selon le comportement Zod par défaut', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(
      pipe.transform(
        { phone: '+33612345678', code: '123456', ignored: true },
        { type: 'body' },
      ),
    ).toEqual({ phone: '+33612345678', code: '123456' });
  });
});
