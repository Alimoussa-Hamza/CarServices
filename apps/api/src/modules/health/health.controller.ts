import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  liveness() {
    return this.healthService.check();
  }

  @Get('ready')
  readiness() {
    return this.healthService.ready();
  }
}
