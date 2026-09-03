import {
  BadRequestException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { AuthService } from '../auth.service';
import { OtpService } from '../otp.service';
import { SmsService } from '../sms.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

const user: User = {
  id: '4e165206-73f4-4987-86dd-eafde885a323',
  phone: '+33612345678',
  email: null,
  passwordHash: null,
  role: UserRole.client,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

type PrismaMock = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
  };
  refreshToken: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
};

type RedisMock = {
  incr: jest.Mock;
  expire: jest.Mock;
  ttl: jest.Mock;
  set: jest.Mock;
  get: jest.Mock;
  del: jest.Mock;
};

function buildMocks() {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const redisClient: RedisMock = {
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(42),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    del: jest.fn().mockResolvedValue(1),
  };

  const otpService = {
    generateCode: jest.fn().mockReturnValue('123456'),
    hashCode: jest.fn((code: string) => `hash:${code}`),
    otpKey: jest.fn((phone: string) => `otp:${phone}`),
    rateLimitKey: jest.fn((phone: string) => `otp:rate:${phone}`),
    logDevOtp: jest.fn(),
  };

  const smsService = {
    sendOtp: jest.fn().mockResolvedValue(undefined),
  };

  const jwtService = {
    sign: jest.fn().mockReturnValue('access.jwt'),
  };

  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, number | string> = {
        JWT_ACCESS_TTL_SECONDS: 900,
        JWT_REFRESH_TTL_SECONDS: 604800,
        JWT_REFRESH_SECRET: 'refresh-secret',
      };
      return values[key];
    }),
  };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    { client: redisClient } as unknown as RedisService,
    otpService as unknown as OtpService,
    smsService as unknown as SmsService,
    jwtService as unknown as JwtService,
    config as unknown as ConfigService,
  );

  return {
    service,
    prisma,
    redisClient,
    otpService,
    smsService,
    jwtService,
    config,
  };
}

describe('AuthService', () => {
  describe('sendOtp', () => {
    it('hash le code, le stocke dans Redis avec TTL et déclenche le SMS', async () => {
      const { service, redisClient, otpService, smsService } = buildMocks();

      await expect(
        service.sendOtp({ phone: '+33612345678', role: 'client' }),
      ).resolves.toEqual({
        data: { expiresIn: 300, retryAfter: null },
      });

      expect(redisClient.incr).toHaveBeenCalledWith('otp:rate:+33612345678');
      expect(redisClient.expire).toHaveBeenCalledWith(
        'otp:rate:+33612345678',
        600,
      );
      expect(redisClient.set).toHaveBeenCalledWith(
        'otp:+33612345678',
        JSON.stringify({ hash: 'hash:123456', role: 'client' }),
        'EX',
        300,
      );
      expect(otpService.logDevOtp).toHaveBeenCalledWith(
        '+33612345678',
        '123456',
      );
      expect(smsService.sendOtp).toHaveBeenCalledWith(
        '+33612345678',
        '123456',
      );
    });

    it('retourne 429 quand le rate limit OTP est dépassé', async () => {
      const { service, redisClient } = buildMocks();
      redisClient.incr.mockResolvedValue(6);
      redisClient.ttl.mockResolvedValue(120);

      await expect(
        service.sendOtp({ phone: '+33612345678', role: 'client' }),
      ).rejects.toMatchObject({
        status: 429,
      } satisfies Partial<HttpException>);
    });

    it('retourne SMS_FAILED si le provider SMS échoue', async () => {
      const { service, smsService } = buildMocks();
      smsService.sendOtp.mockRejectedValue(new Error('twilio down'));

      await expect(
        service.sendOtp({ phone: '+33612345678', role: 'client' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('rejette un OTP expiré ou absent', async () => {
      const { service, redisClient } = buildMocks();
      redisClient.get.mockResolvedValue(null);

      await expect(
        service.verifyOtp({
          phone: '+33612345678',
          code: '123456',
          acceptTerms: true,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejette un OTP incorrect', async () => {
      const { service, redisClient } = buildMocks();
      redisClient.get.mockResolvedValue(
        JSON.stringify({ hash: 'hash:000000', role: 'client' }),
      );

      await expect(
        service.verifyOtp({
          phone: '+33612345678',
          code: '123456',
          acceptTerms: true,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('crée automatiquement un profil client à la première connexion', async () => {
      const { service, redisClient, prisma, jwtService } = buildMocks();
      redisClient.get.mockResolvedValue(
        JSON.stringify({ hash: 'hash:123456', role: 'client' }),
      );
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(user);

      const result = await service.verifyOtp({
        phone: '+33612345678',
        code: '123456',
        acceptTerms: true,
      });

      expect(redisClient.del).toHaveBeenCalledWith('otp:+33612345678');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          phone: '+33612345678',
          role: 'client',
          clientProfile: { create: {} },
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: user.id, role: user.role },
        { expiresIn: 900 },
      );
      expect(result.data.user).toEqual({
        id: user.id,
        role: user.role,
        phone: user.phone,
      });
      expect(result.data.refreshToken).toMatch(/^[a-f0-9]{64}$/);
    });

    it('rejette un numéro déjà associé à un autre rôle', async () => {
      const { service, redisClient, prisma } = buildMocks();
      redisClient.get.mockResolvedValue(
        JSON.stringify({ hash: 'hash:123456', role: 'provider' }),
      );
      prisma.user.findUnique.mockResolvedValue(user);

      await expect(
        service.verifyOtp({
          phone: '+33612345678',
          code: '123456',
          acceptTerms: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('refresh', () => {
    it('rejette un refresh token inconnu, expiré, révoqué ou utilisateur inactif', async () => {
      const { service, prisma } = buildMocks();
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'missing-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1_000),
        user,
      });

      await expect(
        service.refresh({ refreshToken: 'expired-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('révoque le refresh courant et émet une nouvelle paire de tokens', async () => {
      const { service, prisma } = buildMocks();
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'refresh-token-id',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user,
      });

      const result = await service.refresh({ refreshToken: 'valid-token' });

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'refresh-token-id' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: user.id,
          tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          expiresAt: expect.any(Date),
        },
      });
      expect(result.data.accessToken).toBe('access.jwt');
      expect(result.data.expiresIn).toBe(900);
    });
  });

  describe('logout', () => {
    it('révoque le refresh token associé à l’utilisateur courant', async () => {
      const { service, prisma } = buildMocks();

      await expect(
        service.logout(user.id, { refreshToken: 'token-to-revoke' }),
      ).resolves.toEqual({ data: { success: true } });

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: user.id,
          tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('getMe', () => {
    it('retourne le profil client courant', async () => {
      const { service, prisma } = buildMocks();
      const clientProfile = {
        id: 'profile-id',
        userId: user.id,
        firstName: null,
        lastName: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        clientProfile,
        providerProfile: null,
      });

      await expect(service.getMe(user.id)).resolves.toEqual({
        data: {
          id: user.id,
          role: user.role,
          phone: user.phone,
          email: null,
          profile: clientProfile,
        },
      });
    });

    it('rejette un utilisateur absent ou inactif', async () => {
      const { service, prisma } = buildMocks();
      prisma.user.findUnique.mockResolvedValue({ ...user, isActive: false });

      await expect(service.getMe(user.id)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
