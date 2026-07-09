import { Controller, Get, Post, Param, Body, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { SalesService } from './sales.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PERMISSIONS, canConfirmSalesOrders } from '../../common/permissions';

@Controller('sales')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get('orders')
  @RequirePermission(PERMISSIONS.SALES_READ)
  findOrders() {
    return this.salesService.findAll();
  }

  @Get('invoices')
  @RequirePermission(PERMISSIONS.SALES_READ)
  findInvoices() {
    return this.salesService.findInvoices();
  }

  @Post('orders')
  @RequirePermission(PERMISSIONS.SALES_WRITE)
  createOrder(
    @Body() body: {
      customerId: string;
      orderDate: string;
      notes?: string;
      items: { productId: string; qty: number; rate: number }[];
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.salesService.createOrder({ ...body, createdBy: user.sub });
  }

  @Post('orders/:id/confirm')
  @RequirePermission(PERMISSIONS.SALES_WRITE)
  confirmOrder(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (!canConfirmSalesOrders(user.role)) {
      throw new ForbiddenException('Only Accountant or Manager can confirm orders and generate invoices');
    }
    return this.salesService.confirmOrder(id, user.sub);
  }

  @Post('orders/:id/cancel')
  @RequirePermission(PERMISSIONS.SALES_WRITE)
  cancelOrder(@Param('id') id: string) {
    return this.salesService.cancelOrder(id);
  }

  @Get('invoices/:id/pdf')
  @RequirePermission(PERMISSIONS.SALES_READ)
  async getInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    return this.salesService.generateInvoicePdf(id, res);
  }
}
