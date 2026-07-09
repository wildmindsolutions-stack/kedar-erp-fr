import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ManufacturingService } from './manufacturing.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../common/permissions';

@Controller('manufacturing')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ManufacturingController {
  constructor(private manufacturingService: ManufacturingService) {}

  @Get()
  @RequirePermission(PERMISSIONS.MANUFACTURING_READ)
  findAll() {
    return this.manufacturingService.findAll();
  }

  @Get('yield')
  @RequirePermission(PERMISSIONS.MANUFACTURING_READ)
  getYieldReport() {
    return this.manufacturingService.getYieldReport();
  }

  @Post()
  @RequirePermission(PERMISSIONS.MANUFACTURING_WRITE)
  create(
    @Body() body: {
      productId: string;
      batchNo: string;
      batchDate: string;
      qtyProduced: number;
      notes?: string;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.manufacturingService.create({ ...body, createdBy: user.sub });
  }
}
