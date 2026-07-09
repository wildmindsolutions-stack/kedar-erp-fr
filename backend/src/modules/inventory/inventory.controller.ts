import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../common/permissions';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  getStockSummary() {
    return this.inventoryService.getStockSummary();
  }

  @Get('ledger')
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  getLedger(@Query('productId') productId?: string) {
    return this.inventoryService.getLedger(productId);
  }

  @Get('alerts')
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  getLowStockAlerts() {
    return this.inventoryService.getLowStockAlerts();
  }

  @Post('adjust')
  @RequirePermission(PERMISSIONS.INVENTORY_WRITE)
  adjust(
    @Body() body: { productId: string; qtyChange: number; notes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.adjust({ ...body, createdBy: user.sub });
  }

  @Post('transfer')
  @RequirePermission(PERMISSIONS.INVENTORY_WRITE)
  transfer(
    @Body() body: { fromProductId: string; toProductId: string; qty: number; notes?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryService.transfer({ ...body, createdBy: user.sub });
  }
}
