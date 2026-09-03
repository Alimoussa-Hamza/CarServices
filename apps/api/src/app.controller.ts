import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      data: {
        name: 'CARSERVICE API',
        version: '0.0.1',
        docs: '/api/v1/health',
      },
    };
  }
}
