import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeliveryService } from './delivery.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../common/permissions';

@Controller('delivery')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class DeliveryController {
  constructor(private deliveryService: DeliveryService) {}

  @Get('invoices')
  @RequirePermission(PERMISSIONS.DELIVERY_READ)
  getAvailableInvoices() {
    return this.deliveryService.getAvailableInvoices();
  }

  @Get()
  @RequirePermission(PERMISSIONS.DELIVERY_READ)
  findAll() {
    return this.deliveryService.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.DELIVERY_WRITE)
  create(
    @Body() body: { invoiceId: string; vehicle?: string; driverName?: string; notes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.deliveryService.create({ ...body, createdBy: user.sub });
  }

  @Patch(':id/dispatch')
  @RequirePermission(PERMISSIONS.DELIVERY_WRITE)
  dispatch(
    @Param('id') id: string,
    @Body() body: { vehicle?: string; driverName?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.deliveryService.dispatch(id, { ...body, actorId: user.sub });
  }

  @Patch(':id/delivered')
  @RequirePermission(PERMISSIONS.DELIVERY_WRITE)
  markDelivered(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.deliveryService.markDelivered(id, user.sub);
  }
}
