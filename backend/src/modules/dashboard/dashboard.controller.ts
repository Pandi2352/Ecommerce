import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

/** Admin dashboard analytics. Any authenticated staff member may view it. */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  overview() {
    return this.dashboard.overview();
  }
}
