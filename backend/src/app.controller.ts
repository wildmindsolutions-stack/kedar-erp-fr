import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** Lightweight ping — use to wake Render / verify API is up. */
  @Get('health')
  health() {
    return { status: 'ok', timestamp: Date.now() };
  }
}
