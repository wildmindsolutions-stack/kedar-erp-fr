import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../common/permissions';

@Controller('payments')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PAYMENTS_READ)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('outstanding')
  @RequirePermission(PERMISSIONS.PAYMENTS_READ)
  getOutstanding() {
    return this.paymentsService.getOutstanding();
  }

  @Post()
  @RequirePermission(PERMISSIONS.PAYMENTS_WRITE)
  create(
    @Body() body: {
      customerId: string;
      amount: number;
      mode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
      reference?: string;
      receivedAt: string;
      notes?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.paymentsService.create({ ...body, createdBy: user.sub });
  }
}
