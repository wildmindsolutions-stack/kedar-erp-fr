import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CustomersService } from './customers.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../common/permissions';

@Controller('customers')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  @RequirePermission(PERMISSIONS.CUSTOMERS_READ)
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  @RequirePermission(PERMISSIONS.CUSTOMERS_READ)
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @RequirePermission(PERMISSIONS.CUSTOMERS_WRITE)
  create(
    @Body() body: {
      name: string;
      gstin?: string;
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      state?: string;
      creditLimit?: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.customersService.create({ ...body, createdBy: user.sub });
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.CUSTOMERS_WRITE)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.customersService.update(id, body as Parameters<CustomersService['update']>[1]);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.CUSTOMERS_WRITE)
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
