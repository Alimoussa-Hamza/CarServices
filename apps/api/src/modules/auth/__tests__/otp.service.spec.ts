import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { OtpService } from '../otp.service';

describe('OtpService', () => {
  const buildService = async (env: Record<string, string> = {}) => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => env[key] },
        },
      ],
    }).compile();

    return moduleRef.get(OtpService);
  };

  describe('generateCode', () => {
    it('génère un code de 6 chiffres', async () => {
      const service = await buildService();

      for (let i = 0; i < 200; i += 1) {
        expect(service.generateCode()).toMatch(/^\d{6}$/);
      }
    });

    it('conserve les zéros de tête (padding)', async () => {
      const service = await buildService();
      const spy = jest
        .spyOn(require('crypto'), 'randomInt')
        .mockReturnValue(7 as never);

      expect(service.generateCode()).toBe('000007');

      spy.mockRestore();
    });

    it('produit des codes variés', async () => {
      const service = await buildService();
      const codes = new Set(
        Array.from({ length: 100 }, () => service.generateCode()),
      );

      expect(codes.size).toBeGreaterThan(50);
    });
  });

  describe('hashCode', () => {
    it('produit un SHA-256 hexadécimal de 64 caractères', async () => {
      const service = await buildService();

      expect(service.hashCode('123456')).toMatch(/^[a-f0-9]{64}$/);
    });

    it('est déterministe pour un même code', async () => {
      const service = await buildService();

      expect(service.hashCode('123456')).toBe(service.hashCode('123456'));
    });

    it('produit un hash différent pour un code différent', async () => {
      const service = await buildService();

      expect(service.hashCode('123456')).not.toBe(service.hashCode('123457'));
    });

    it('dépend du pepper — deux instances configurées différemment divergent', async () => {
      const withDefaultPepper = await buildService();
      const withCustomPepper = await buildService({
        OTP_PEPPER: 'un-autre-pepper',
      });

      expect(withDefaultPepper.hashCode('123456')).not.toBe(
        withCustomPepper.hashCode('123456'),
      );
    });

    it('ne stocke jamais le code en clair dans le hash', async () => {
      const service = await buildService();

      expect(service.hashCode('123456')).not.toContain('123456');
    });
  });

  describe('clés Redis', () => {
    it('namespace la clé OTP par téléphone', async () => {
      const service = await buildService();

      expect(service.otpKey('+33612345678')).toBe('otp:+33612345678');
    });

    it('namespace la clé de rate limit séparément', async () => {
      const service = await buildService();

      expect(service.rateLimitKey('+33612345678')).toBe(
        'otp:rate:+33612345678',
      );
    });

    it("n'entre pas en collision entre clé OTP et clé de rate limit", async () => {
      const service = await buildService();

      expect(service.otpKey('+33612345678')).not.toBe(
        service.rateLimitKey('+33612345678'),
      );
    });
  });

  describe('logDevOtp', () => {
    afterEach(() => jest.restoreAllMocks());

    it('logue le code hors production (confort de dev)', async () => {
      const service = await buildService({ NODE_ENV: 'development' });
      const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      service.logDevOtp('+33612345678', '123456');

      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('+33612345678'),
      );
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('123456'));
    });

    it('ne logue jamais le code en production', async () => {
      const service = await buildService({ NODE_ENV: 'production' });
      const spy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      service.logDevOtp('+33612345678', '123456');

      expect(spy).not.toHaveBeenCalled();
    });
  });
});
