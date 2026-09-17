process.env.JWT_ACCESS_TTL_SECONDS ??= '86400';
process.env.THROTTLE_LIMIT ??= '10000';
/** Gates isolées : PaymentIntent / Connect mock, pas d’appel réseau Stripe. */
process.env.STRIPE_SECRET_KEY = '';
process.env.STRIPE_WEBHOOK_SECRET = '';

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from '../../src/common/interceptors/response-envelope.interceptor';
import { OtpService } from '../../src/modules/auth/otp.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { E2eOtpService } from './e2e-otp.service';

export async function createE2eApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(OtpService)
    .useClass(E2eOtpService)
    .compile();

  const app = moduleRef.createNestApplication({ rawBody: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
  };
}
