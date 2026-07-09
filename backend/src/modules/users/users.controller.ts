import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('Owner', 'Admin')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('roles')
  findRoles() {
    return this.usersService.findRoles();
  }

  @Post()
  create(@Body() body: { name: string; email: string; password: string; roleId: string }) {
    return this.usersService.create(body);
  }

  @Patch('roles/:roleId')
  updateRole(
    @Param('roleId') roleId: string,
    @Body() body: { isActive?: boolean },
  ) {
    return this.usersService.updateRole(roleId, body);
  }

  @Delete('roles/:roleId')
  removeRole(@Param('roleId') roleId: string) {
    return this.usersService.removeRole(roleId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; roleId?: string; isActive?: boolean },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(user.sub, id, body);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.deactivate(user.sub, id);
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() body: { password: string }) {
    return this.usersService.resetPassword(id, body.password);
  }
}
