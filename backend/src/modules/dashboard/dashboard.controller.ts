import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../common/permissions';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @RequirePermission(PERMISSIONS.DASHBOARD_READ)
  getStats(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getStats(user.role, user.permissions || []);
  }
}
