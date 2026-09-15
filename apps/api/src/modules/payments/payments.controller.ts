import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsQueueService } from './payments-queue.service';
import { StripeService } from './stripe.service';

@Controller('webhooks')
export class PaymentsWebhookController {
  constructor(
    private readonly stripe: StripeService,
    private readonly queue: PaymentsQueueService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
    @Body() body?: unknown,
  ) {
    const event = this.stripe.parseWebhookEvent(
      req.rawBody,
      signature,
      body,
    );
    return this.queue.ingest(event);
  }
}
