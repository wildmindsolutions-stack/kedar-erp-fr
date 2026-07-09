import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../../common/permissions';

@Controller('products')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.PRODUCTS_READ)
  findAll() {
    return this.productsService.findAll();
  }

  @Get('categories')
  @RequirePermission(PERMISSIONS.PRODUCTS_READ)
  findCategories() {
    return this.productsService.findCategories();
  }

  @Get('units')
  @RequirePermission(PERMISSIONS.PRODUCTS_READ)
  findUnits() {
    return this.productsService.findUnits();
  }

  @Post()
  @RequirePermission(PERMISSIONS.PRODUCTS_WRITE)
  create(
    @Body() body: {
      name: string;
      categoryId: string;
      unitId: string;
      price: number;
      hsnCode: string;
      gstRate?: number;
      lowStockThreshold?: number;
    },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.productsService.create({ ...body, createdBy: user.sub });
  }

  @Patch(':id')
  @RequirePermission(PERMISSIONS.PRODUCTS_WRITE)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.productsService.update(id, body as Parameters<ProductsService['update']>[1]);
  }

  @Delete(':id')
  @RequirePermission(PERMISSIONS.PRODUCTS_WRITE)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
