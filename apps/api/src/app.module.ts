import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthModule } from './modules/health/health.module';
import { MediaModule } from './modules/media/media.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { RedisModule } from './modules/redis/redis.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { ZonesModule } from './modules/zones/zones.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PrismaModule } from './prisma/prisma.module';

const isProd = process.env.NODE_ENV === 'production';
const throttleTtlMs = Number(process.env.THROTTLE_TTL_MS ?? 60_000);
const throttleLimit = Number(process.env.THROTTLE_LIMIT ?? 100);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SentryModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
        transport: isProd
          ? undefined
          : {
              target: 'pino-pretty',
              options: { singleLine: true, colorize: true },
            },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.phone',
            'req.body.email',
            'req.body.code',
            'req.body.password',
          ],
          censor: '[Filtered]',
        },
        autoLogging: {
          ignore: (req) => req.url?.includes('/health') === true,
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: throttleTtlMs,
        limit: throttleLimit,
      },
    ]),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    CatalogModule,
    ZonesModule,
    AddressesModule,
    ClientsModule,
    ProvidersModule,
    MediaModule,
    PaymentsModule,
    ReviewsModule,
    DisputesModule,
    NotificationsModule,
    BookingsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
