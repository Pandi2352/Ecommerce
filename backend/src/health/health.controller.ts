import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  /** GET /api/health — liveness + Mongo connection state. */
  @Public()
  @Get()
  check() {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    const db = states[this.connection.readyState] ?? 'unknown';
    return {
      status: db === 'connected' ? 'ok' : 'degraded',
      db,
      uptime: Math.round(process.uptime()),
    };
  }
}
