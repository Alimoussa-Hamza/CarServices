import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import {
  AdminLoginDto,
  OtpRole,
  RefreshTokenDto,
  SendOtpDto,
  VerifyOtpDto,
} from '@carservice/shared-types';
import { createHash, randomBytes } from 'crypto';
import { AuthPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  OTP_RATE_LIMIT_MAX,
  OTP_RATE_LIMIT_WINDOW_SECONDS,
  OTP_TTL_SECONDS,
  OtpService,
} from './otp.service';
import { DUMMY_PASSWORD_HASH, verifyPassword } from './password.util';
import { SmsService } from './sms.service';

type OtpCacheEntry = {
  hash: string;
  role: OtpRole;
};

const ADMIN_LOGIN_RATE_LIMIT_MAX = 10;
const ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS = 900;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly otpService: OtpService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const retryAfter = await this.checkRateLimit(dto.phone);
    if (retryAfter !== null) {
      throw new HttpException(
        {
          code: 'OTP_RATE_LIMIT',
          message: 'Trop de demandes. Réessayez plus tard.',
          details: [{ retryAfter }],
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.otpService.generateCode();
    const entry: OtpCacheEntry = {
      hash: this.otpService.hashCode(code),
      role: dto.role,
    };

    await this.redis.client.set(
      this.otpService.otpKey(dto.phone),
      JSON.stringify(entry),
      'EX',
      OTP_TTL_SECONDS,
    );

    this.otpService.logDevOtp(dto.phone, code);

    try {
      await this.smsService.sendOtp(dto.phone, code);
    } catch {
      throw new BadRequestException({
        code: 'SMS_FAILED',
        message: "Impossible d'envoyer le SMS.",
        details: [],
      });
    }

    return {
      data: {
        expiresIn: OTP_TTL_SECONDS,
        retryAfter: null as number | null,
      },
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const raw = await this.redis.client.get(this.otpService.otpKey(dto.phone));

    if (!raw) {
      throw new UnauthorizedException({
        code: 'OTP_INVALID',
        message: 'Code expiré ou invalide.',
        details: [],
      });
    }

    const entry = JSON.parse(raw) as OtpCacheEntry;
    const hash = this.otpService.hashCode(dto.code);

    if (entry.hash !== hash) {
      throw new UnauthorizedException({
        code: 'OTP_INVALID',
        message: 'Code expiré ou invalide.',
        details: [],
      });
    }

    await this.redis.client.del(this.otpService.otpKey(dto.phone));

    const user = await this.findOrCreateUser(dto.phone, entry.role);
    const tokens = await this.issueTokens(user);

    return {
      data: {
        ...tokens,
        user: this.toAuthUser(user),
      },
    };
  }

  async loginAdmin(dto: AdminLoginDto) {
    const email = dto.email.trim().toLowerCase();
    const retryAfter = await this.checkAdminLoginRateLimit(email);
    if (retryAfter !== null) {
      throw new HttpException(
        {
          code: 'AUTH_RATE_LIMIT',
          message: 'Trop de tentatives. Réessayez plus tard.',
          details: [{ retryAfter }],
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
    const passwordOk = await verifyPassword(dto.password, hash);

    if (
      !user ||
      !user.isActive ||
      user.role !== UserRole.admin ||
      !user.passwordHash ||
      !passwordOk
    ) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Email ou mot de passe incorrect.',
        details: [],
      });
    }

    const tokens = await this.issueTokens(user);

    return {
      data: {
        ...tokens,
        user: this.toAuthUser(user),
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      !stored.user.isActive
    ) {
      throw new UnauthorizedException({
        code: 'REFRESH_INVALID',
        message: 'Session expirée. Reconnectez-vous.',
        details: [],
      });
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(stored.user);

    return { data: tokens };
  }

  async logout(userId: string, dto: RefreshTokenDto) {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { data: { success: true } };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        clientProfile: true,
        providerProfile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Utilisateur introuvable.',
        details: [],
      });
    }

    return {
      data: {
        id: user.id,
        role: user.role,
        phone: user.phone,
        email: user.email,
        profile:
          user.role === UserRole.client
            ? user.clientProfile
            : user.role === UserRole.provider
              ? user.providerProfile
              : null,
      },
    };
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
    };
  }

  private async checkRateLimit(phone: string): Promise<number | null> {
    const key = this.otpService.rateLimitKey(phone);
    const count = await this.redis.client.incr(key);

    if (count === 1) {
      await this.redis.client.expire(key, OTP_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > OTP_RATE_LIMIT_MAX) {
      const ttl = await this.redis.client.ttl(key);
      return ttl > 0 ? ttl : OTP_RATE_LIMIT_WINDOW_SECONDS;
    }

    return null;
  }

  private async checkAdminLoginRateLimit(
    email: string,
  ): Promise<number | null> {
    const key = `auth:admin:rate:${email}`;
    const count = await this.redis.client.incr(key);

    if (count === 1) {
      await this.redis.client.expire(key, ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS);
    }

    if (count > ADMIN_LOGIN_RATE_LIMIT_MAX) {
      const ttl = await this.redis.client.ttl(key);
      return ttl > 0 ? ttl : ADMIN_LOGIN_RATE_LIMIT_WINDOW_SECONDS;
    }

    return null;
  }

  private async findOrCreateUser(phone: string, role: OtpRole): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { phone } });

    if (existing) {
      if (existing.role !== role && existing.role !== UserRole.admin) {
        throw new BadRequestException({
          code: 'ROLE_MISMATCH',
          message: 'Ce numéro est déjà associé à un autre type de compte.',
          details: [],
        });
      }
      return existing;
    }

    return this.prisma.user.create({
      data: {
        phone,
        role,
        ...(role === 'client'
          ? { clientProfile: { create: {} } }
          : { providerProfile: { create: {} } }),
      },
    });
  }

  private async issueTokens(user: User) {
    const payload: AuthPayload = { sub: user.id, role: user.role };
    const accessExpiresIn = this.config.get<number>('JWT_ACCESS_TTL_SECONDS') ?? 900;
    const refreshExpiresIn =
      this.config.get<number>('JWT_REFRESH_TTL_SECONDS') ?? 604800;

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn,
    });

    const refreshToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
    };
  }

  private hashRefreshToken(token: string): string {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh';
    return createHash('sha256').update(`${token}:${secret}`).digest('hex');
  }
}
